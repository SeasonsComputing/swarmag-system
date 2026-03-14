/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Asset protocol contracts                                                    ║
║ Create and update payload contracts for asset topic abstractions            ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines boundary payload contracts for asset persisted abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AssetTypeCreate                    Create payload contract for AssetType.
AssetTypeUpdate                    Update payload contract for AssetType.
AssetCreate                        Create payload contract for Asset.
AssetUpdate                        Update payload contract for Asset.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { Asset, AssetType } from '@domain/abstractions/asset.ts'

/** Create payload contract for AssetType. */
export type AssetTypeCreate = CreateFromInstantiable<AssetType>

/** Update payload contract for AssetType. */
export type AssetTypeUpdate = UpdateFromInstantiable<AssetType>

/** Create payload contract for Asset. */
export type AssetCreate = CreateFromInstantiable<Asset>

/** Update payload contract for Asset. */
export type AssetUpdate = UpdateFromInstantiable<Asset>
