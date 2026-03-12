/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Asset protocol shapes                                                        ║
║ Create and update payloads for asset topic abstractions.                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines create and update protocol shapes for AssetType and Asset.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
AssetTypeCreate  Create payload for an AssetType.
AssetTypeUpdate  Update payload for an AssetType.
AssetCreate      Create payload for an Asset.
AssetUpdate      Update payload for an Asset.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { Asset, AssetType } from '@domain/abstractions/asset.ts'

// ────────────────────────────────────────────────────────────────────────────
// PROTOCOL
// ────────────────────────────────────────────────────────────────────────────

export type AssetTypeCreate = CreateFromInstantiable<AssetType>
export type AssetTypeUpdate = UpdateFromInstantiable<AssetType>

export type AssetCreate = CreateFromInstantiable<Asset>
export type AssetUpdate = UpdateFromInstantiable<Asset>
