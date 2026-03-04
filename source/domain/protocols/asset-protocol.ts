/**
 * Asset domain protocols.
 */

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type { Asset, AssetType } from '@domain/abstractions/asset.ts'

export type AssetTypeCreate = CreateFromInstantiable<AssetType>
export type AssetTypeUpdate = UpdateFromInstantiable<AssetType>
export type AssetCreate = CreateFromInstantiable<Asset>
export type AssetUpdate = UpdateFromInstantiable<Asset>
