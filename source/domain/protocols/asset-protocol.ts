/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Asset protocol types                                                         ║
║ Boundary payload contracts for asset topic abstractions.                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines create and update protocol payload shapes for asset abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AssetTypeCreate  Create payload for AssetType.
AssetTypeUpdate  Update payload for AssetType.
AssetCreate      Create payload for Asset.
AssetUpdate      Update payload for Asset.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { Asset, AssetType } from '@domain/abstractions/asset.ts'

/* AssetType protolocl */
export type AssetTypeCreate = CreateFromInstantiable<AssetType>
export type AssetTypeUpdate = UpdateFromInstantiable<AssetType>

/* Asset protocol */
export type AssetCreate = CreateFromInstantiable<Asset>
export type AssetUpdate = UpdateFromInstantiable<Asset>
