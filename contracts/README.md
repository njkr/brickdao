# BrickDAO – Smart Contracts

ERC-1155 property tokenization contract, rewritten from BrickFi's `contracts/AssetFactory.sol` with a working Hardhat 3 (viem) toolchain — the original had no build tooling at all, so it couldn't be compiled, tested, or deployed from that repo.

## What changed from BrickFi

- **`buy()` now charges `cost * amount`.** The original only checked `msg.value == cost` no matter how many tokens `_amount` asked for — a whitelisted buyer could pay for one token and receive many. Covered by a test (`test/AssetFactory.ts`).
- **The admin fee-bypass is self-service only.** Previously any address could call `buy()` naming an admin as `_buyer` and trigger a free transfer to that admin. Now the bypass only fires when `msg.sender == _buyer` and that address holds `DEFAULT_ADMIN_ROLE`.
- **Payouts use `.call` instead of `.transfer()`**, and `buy()` is `nonReentrant`. The old fixed 2300-gas `.transfer()` would revert against any owner that's a multisig or other contract wallet with a non-trivial `receive()`.
- **Upgraded to OpenZeppelin v5** (`Ownable(root)` constructor arg, `_update` in place of the removed `_beforeTokenTransfer` hook, `_grantRole` instead of the deprecated `_setupRole`).
- Dropped `Migrations.sol` — that was Truffle's on-chain migration tracker; Hardhat doesn't use it.

## Setup

```bash
npm install
npx hardhat compile
npx hardhat test
```

## Deploying

Local ephemeral network (state is lost when the command exits):

```bash
npx hardhat ignition deploy ignition/modules/AssetFactory.ts --network hardhatMainnet
```

Persistent local chain (state survives between commands, which the backend and frontend need):

```bash
npx hardhat node            # terminal 1: JSON-RPC on http://127.0.0.1:8545, chain id 31337
npx hardhat ignition deploy ignition/modules/AssetFactory.ts --network localhost   # terminal 2
```

The deployer (Hardhat account #0) becomes the contract owner and admin. A fresh deployment holds no tokens and no whitelist entries, so before a purchase can succeed an admin has to mint supply and whitelist the buyer. For example, as a one-off script run with `npx hardhat run <file> --network localhost` (use the address printed by the deploy step):

```ts
import { network } from 'hardhat';

const { viem } = await network.getOrCreate();
const [admin] = await viem.getWalletClients();
const factory = await viem.getContractAt('AssetFactory', '<deployed address>');

// 1000 tokens each of token ids 1-6, minted to the owner who sells them
await factory.write.batchMint([admin.account.address, [1n, 2n, 3n, 4n, 5n, 6n], Array(6).fill(1000n)]);
// whitelist a buyer for token id 1
await factory.write.addToWhitelist([1n, '<buyer address>']);
```

A whitelist entry holds one buyer per token id and expires after `expiry` seconds (default 7 days). The price is the contract-wide `cost` (default 0.001 ETH per token), changeable by an admin with `setCost`.

A real network (e.g. Sepolia) — set `SEPOLIA_RPC_URL` / `SEPOLIA_PRIVATE_KEY` via `npx hardhat keystore set`, then:

```bash
npx hardhat ignition deploy ignition/modules/AssetFactory.ts \
  --network sepolia \
  --parameters '{"AssetFactoryModule":{"root":"0xYourAdminAddress","costWei":"1000000000000000"}}'
```

Copy the deployed address into `frontend/.env.local` as `NEXT_PUBLIC_ASSET_FACTORY_ADDRESS`.
