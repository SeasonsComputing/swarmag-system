/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Asset domain adapters                                                       ║
║ Dictionary serialization for asset topic abstractions                       ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Serializes asset topic abstractions between Dictionary and domain shapes.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toAssetType                         Deserialize AssetType from Dictionary.
fromAssetType                       Serialize AssetType to Dictionary.
toAsset                             Deserialize Asset from Dictionary.
fromAsset                           Serialize Asset to Dictionary.
*/

import type { Dictionary, Id, When } from '@core/std'
import type { Asset, AssetType } from '@domain/abstractions/asset.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

/** Deserialize AssetType from Dictionary. */
export const toAssetType = (dict: Dictionary): AssetType => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  label: dict.label as string,
  active: dict.active as boolean
})

/** Serialize AssetType to Dictionary. */
export const fromAssetType = (assetType: AssetType): Dictionary => ({
  id: assetType.id,
  created_at: assetType.createdAt,
  updated_at: assetType.updatedAt,
  deleted_at: assetType.deletedAt,
  label: assetType.label,
  active: assetType.active
})

/** Deserialize Asset from Dictionary. */
export const toAsset = (dict: Dictionary): Asset => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  type: dict.type_id as Id,
  notes: (dict.notes as Dictionary[]).map(toNote),
  label: dict.label as string,
  description: dict.description as string | undefined,
  serialNumber: dict.serial_number as string | undefined,
  status: dict.status as Asset['status']
})

/** Serialize Asset to Dictionary. */
export const fromAsset = (asset: Asset): Dictionary => ({
  id: asset.id,
  created_at: asset.createdAt,
  updated_at: asset.updatedAt,
  deleted_at: asset.deletedAt,
  type_id: asset.type,
  notes: asset.notes.map(fromNote),
  label: asset.label,
  description: asset.description,
  serial_number: asset.serialNumber,
  status: asset.status
})
