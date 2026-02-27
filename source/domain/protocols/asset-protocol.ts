/**
 * Protocol input shapes for Asset boundary operations.
 */

import type {
  CreateFromInstantiable,
  UpdateFromInstantiable
} from '@core-std'
import type { Asset, AssetType } from '@domain/abstractions/asset.ts'

/** Input for creating an AssetType. */
export type AssetTypeCreate = CreateFromInstantiable<AssetType>

/** Input for updating an AssetType. */
export type AssetTypeUpdate = UpdateFromInstantiable<AssetType>

/** Input for creating an Asset. */
export type AssetCreate = CreateFromInstantiable<Asset>

/** Input for updating an Asset. */
export type AssetUpdate = UpdateFromInstantiable<Asset>
