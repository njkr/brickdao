/**
 * Contract configuration for BrickDAO.
 * Set NEXT_PUBLIC_ASSET_FACTORY_ADDRESS in .env.local to your deployed
 * AssetFactory address (see contracts/README.md for deploying it).
 */
import { assetFactoryAbi } from './asset-factory-abi';

export const ASSET_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_ASSET_FACTORY_ADDRESS ?? '';

export const isContractConfigured = Boolean(
  ASSET_FACTORY_ADDRESS &&
    ASSET_FACTORY_ADDRESS.startsWith('0x') &&
    ASSET_FACTORY_ADDRESS.length === 42,
);

export { assetFactoryAbi };

export const assetFactoryConfig = isContractConfigured
  ? ({ address: ASSET_FACTORY_ADDRESS as `0x${string}`, abi: assetFactoryAbi } as const)
  : ({ address: undefined as undefined, abi: assetFactoryAbi } as const);
