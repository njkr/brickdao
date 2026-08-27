import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { network } from 'hardhat';
import { getAddress, parseEventLogs } from 'viem';

describe('AssetFactory', async function () {
  const { viem } = await network.create();
  const [admin, buyer, stranger] = await viem.getWalletClients();

  const TOKEN_ID = 1n;
  const COST = 10n ** 15n; // 0.001 ether per token

  async function deployWithMintedToken(amount = 10n) {
    const factory = await viem.deployContract('AssetFactory', [
      admin.account.address,
      'BrickDAO Property',
      'BRK',
      'ipfs://token-metadata/',
      'ipfs://contract-metadata',
      3600n, // whitelist expiry window, seconds
      COST,
    ]);
    await factory.write.batchMint([admin.account.address, [TOKEN_ID], [amount]]);
    return factory;
  }

  it('rejects buying more than one token for the price of one', async () => {
    const factory = await deployWithMintedToken();
    await factory.write.addToWhitelist([TOKEN_ID, buyer.account.address]);

    const factoryAsBuyer = await viem.getContractAt('AssetFactory', factory.address, {
      client: { wallet: buyer },
    });

    // The old contract only checked `msg.value == cost`, letting a buyer
    // pay for one token while receiving `amount`. Paying just COST for 5
    // tokens must now fail.
    await assert.rejects(
      factoryAsBuyer.write.buy([TOKEN_ID, buyer.account.address, 5n, '0x'], { value: COST }),
    );
  });

  it('accepts buying multiple tokens when value is cost * amount', async () => {
    const factory = await deployWithMintedToken();
    await factory.write.addToWhitelist([TOKEN_ID, buyer.account.address]);

    const factoryAsBuyer = await viem.getContractAt('AssetFactory', factory.address, {
      client: { wallet: buyer },
    });

    const amount = 5n;
    await factoryAsBuyer.write.buy([TOKEN_ID, buyer.account.address, amount, '0x'], {
      value: COST * amount,
    });

    const balance = await factory.read.balanceOf([buyer.account.address, TOKEN_ID]);
    assert.equal(balance, amount);
  });

  it('lets an admin claim their own fee-free allocation', async () => {
    const factory = await deployWithMintedToken();

    const publicClient = await viem.getPublicClient();
    const tx = await factory.write.buy([TOKEN_ID, admin.account.address, 1n, '0x'], {
      value: 0n,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
    assert.equal(receipt.status, 'success');
  });

  it('does not let a stranger trigger a free transfer to the admin', async () => {
    const factory = await deployWithMintedToken();
    const factoryAsStranger = await viem.getContractAt('AssetFactory', factory.address, {
      client: { wallet: stranger },
    });

    // Naming the admin as `_buyer` from a non-admin caller must not bypass payment —
    // the stranger isn't whitelisted, so this should fail on the whitelist check.
    await assert.rejects(
      factoryAsStranger.write.buy([TOKEN_ID, admin.account.address, 1n, '0x'], { value: 0n }),
    );
  });

  it('only allows an admin to change the price', async () => {
    const factory = await deployWithMintedToken();
    const factoryAsStranger = await viem.getContractAt('AssetFactory', factory.address, {
      client: { wallet: stranger },
    });

    await assert.rejects(factoryAsStranger.write.setCost([1n]));
    await factory.write.setCost([2n]);
    assert.equal(await factory.read.cost(), 2n);
  });

  it('emits Whitelisted with the expected args', async () => {
    const factory = await deployWithMintedToken();
    const tx = await factory.write.addToWhitelist([TOKEN_ID, buyer.account.address]);
    const publicClient = await viem.getPublicClient();
    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
    const logs = parseEventLogs({ abi: factory.abi, logs: receipt.logs, eventName: 'Whitelisted' });
    assert.equal(logs.length, 1);
    assert.equal(getAddress(logs[0].args._address as string), getAddress(buyer.account.address));
  });
});
