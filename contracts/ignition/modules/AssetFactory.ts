import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

/**
 * Deploys one AssetFactory. Parameters default to placeholder values —
 * override them per-deployment, e.g.:
 *   npx hardhat ignition deploy ignition/modules/AssetFactory.ts \
 *     --network sepolia \
 *     --parameters '{"AssetFactoryModule":{"root":"0xYourAdminAddress","costWei":"1000000000000000"}}'
 */
export default buildModule('AssetFactoryModule', (m) => {
  const root = m.getParameter('root', m.getAccount(0));
  const name = m.getParameter('name', 'BrickDAO Property');
  const symbol = m.getParameter('symbol', 'BRK');
  const uri = m.getParameter('uri', 'ipfs://token-metadata/{id}.json');
  const contractURI = m.getParameter('contractURI', 'ipfs://collection-metadata.json');
  const expirySeconds = m.getParameter('expirySeconds', 7n * 24n * 60n * 60n);
  const costWei = m.getParameter('costWei', 10n ** 15n);

  const assetFactory = m.contract('AssetFactory', [
    root,
    name,
    symbol,
    uri,
    contractURI,
    expirySeconds,
    costWei,
  ]);

  return { assetFactory };
});
