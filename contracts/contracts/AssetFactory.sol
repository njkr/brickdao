// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Imports for ERC1155 and access control from OpenZeppelin
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/*
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░░░░░░            Asset Factory            ░░░░░░░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

Ported from BrickFi with three fixes:
  1. buy() now charges cost * amount, not a flat `cost` regardless of how
     many tokens were requested.
  2. buy() only allows the admin fee-bypass when the caller IS the admin
     being credited, not when any address names an admin as `_buyer`.
  3. Payouts use `.call` instead of `.transfer`, and the whole function is
     `nonReentrant` — the old fixed 2300-gas `.transfer()` would silently
     break for a multisig/contract-wallet owner, and there was nothing
     stopping reentrancy through the ERC1155 receiver hook.
*/

contract AssetFactory is ERC1155, AccessControl, Ownable, ReentrancyGuard {
  using Strings for string;

  string public name; // Token name
  string public symbol; // Token symbol
  string public contractURI; // Collection-level metadata
  uint256 public circulation; // Total circulating supply
  uint256 public cost; // Per-token cost, in wei
  uint256 public expiry; // Whitelist expiry window, in seconds
  bool public paused = false; // Switch critical funcs to be paused

  struct Whitelist {
    address buyer;
    uint256 timestamp;
    bool listed;
  }
  struct Owners {
    address prev;
    address current;
    uint256 timestamp;
    uint256 total;
  }

  mapping(uint256 => Whitelist) public whitelist;
  mapping(uint256 => Owners) public owners;
  bytes32 public constant WHITELISTER_ROLE = keccak256("WHITELISTER_ROLE");

  event newOwner(address current, uint256 tokenId);
  event Whitelisted(uint256 indexed _tokenId, address _address, uint256 timestamp);

  constructor(
    address _root,
    string memory _name,
    string memory _symbol,
    string memory _uri,
    string memory _cURI,
    uint256 _expiry,
    uint256 _cost
  ) ERC1155(_uri) Ownable(_root) {
    _grantRole(DEFAULT_ADMIN_ROLE, _root);
    _grantRole(WHITELISTER_ROLE, _root);

    name = _name;
    symbol = _symbol;
    cost = _cost;
    expiry = _expiry;
    circulation = 0;
    contractURI = _cURI;
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(ERC1155, AccessControl)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }

  modifier onlyAdmin() {
    require(isRole(DEFAULT_ADMIN_ROLE, msg.sender), "Restricted to admins.");
    _;
  }

  function addAdmin(bytes32 roleId, bytes32 adminRoleId) external onlyAdmin {
    _setRoleAdmin(roleId, adminRoleId);
  }

  function addToRole(bytes32 roleId, address account) external onlyAdmin {
    grantRole(roleId, account);
  }

  function renounceAdmin() external {
    renounceRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  function isRole(bytes32 roleId, address account) public view returns (bool) {
    return hasRole(roleId, account);
  }

  function getContractURI() public view returns (string memory) {
    return contractURI;
  }

  function isWhitelisted(address _address, uint256 _tokenId) public view returns (bool) {
    bool userIsWhitelisted = false;
    if (whitelist[_tokenId].buyer == _address) {
      userIsWhitelisted = whitelist[_tokenId].listed;
    }
    return userIsWhitelisted;
  }

  /// @dev Wei cost per single token, set by an admin (see setCost).
  function getCost() external view returns (uint256) {
    return cost;
  }

  function batchMint(
    address _to,
    uint256[] memory _tokenIds,
    uint256[] memory _amounts
  ) external onlyAdmin {
    _mintBatch(_to, _tokenIds, _amounts, "");

    for (uint256 i = 0; i < _tokenIds.length; i++) {
      uint256 tokenId = _tokenIds[i];
      owners[tokenId] = Owners(address(0), address(this), block.timestamp, 0);
      circulation += _amounts[i];
    }
  }

  function setURI(string memory _uri) public onlyAdmin {
    _setURI(_uri);
  }

  function setExpiry(uint256 _expiry) external onlyAdmin {
    expiry = _expiry;
  }

  function setCost(uint256 _newCost) external onlyAdmin {
    cost = _newCost;
  }

  function setPaused(bool _paused) external onlyAdmin {
    paused = _paused;
  }

  function addToWhitelist(uint256 _tokenId, address _address) external onlyRole(WHITELISTER_ROLE) {
    require(owners[_tokenId].current != _address, "Address already owns this token.");
    whitelist[_tokenId] = Whitelist(_address, block.timestamp, true);
    emit Whitelisted(_tokenId, _address, block.timestamp);
  }

  function removeFromWhitelist(uint256 _tokenId) public onlyRole(WHITELISTER_ROLE) {
    require(whitelist[_tokenId].listed, "Address is not on the list.");
    delete whitelist[_tokenId];
  }

  /*
   * @dev
   *      Allow a whitelisted buyer to purchase `_amount` tokens, paying
   *      cost * _amount in msg.value. Admins can still be granted a
   *      fee-free allocation, but only by calling this themselves — the
   *      old version let ANY caller trigger a free transfer to any admin
   *      address named as `_buyer`.
   */
  function buy(
    uint256 _tokenId,
    address _buyer,
    uint256 _amount,
    bytes memory _data
  ) external payable nonReentrant {
    require(!paused, "Contract is currently paused.");
    require(_amount > 0, "Amount must be greater than zero.");

    address tokenOwner = owner();
    uint256 available = balanceOf(tokenOwner, _tokenId);
    require(available >= _amount, "Not enough tokens remaining.");

    if (msg.sender == _buyer && isRole(DEFAULT_ADMIN_ROLE, _buyer)) {
      // Fee-free allocation — only the admin themselves can trigger this for their own address.
      _safeTransferFrom(tokenOwner, _buyer, _tokenId, _amount, _data);
      return;
    }

    require(owners[_tokenId].current != _buyer, "Address already owns this token.");
    require(whitelist[_tokenId].buyer == _buyer, "Address is not listed for this token.");
    require(whitelist[_tokenId].listed, "Address is not on the list.");
    require(
      block.timestamp <= (whitelist[_tokenId].timestamp + expiry),
      "Whitelist entry expired."
    );

    uint256 totalCost = cost * _amount;
    require(msg.value == totalCost, "Value does not match cost * amount.");

    _safeTransferFrom(tokenOwner, _buyer, _tokenId, _amount, _data);

    (bool sent, ) = payable(tokenOwner).call{value: msg.value}("");
    require(sent, "Payment transfer to owner failed.");
  }

  function _update(
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory values
  ) internal virtual override {
    for (uint256 i = 0; i < ids.length; i++) {
      owners[ids[i]].prev = from;
      owners[ids[i]].current = to;
      owners[ids[i]].timestamp = block.timestamp;
      owners[ids[i]].total += 1;
      emit newOwner(to, ids[i]);
    }
    super._update(from, to, ids, values);
  }

  function withdraw() external onlyAdmin {
    (bool sent, ) = payable(owner()).call{value: address(this).balance}("");
    require(sent, "Withdrawal failed.");
  }
}
