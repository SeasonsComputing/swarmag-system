/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Asset domain adapters                                                        ║
║ Dictionary serialization for asset topic abstractions.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Maps storage dictionaries to asset abstractions and back.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toAssetType(dict)  Deserialize AssetType from dictionary.
fromAssetType(assetType)  Serialize AssetType to dictionary.
toAsset(dict)  Deserialize Asset from dictionary.
fromAsset(asset)  Serialize Asset to dictionary.
*/

import type { Dictionary } from '@core/std'
import type { Asset, AssetType } from '@domain/abstractions/asset.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

export const toAssetType = (dict: Dictionary): AssetType => ({
  id: dict.id as string,
  createdAt: dict.created_at as string,
  updatedAt: dict.updated_at as string,
  deletedAt: dict.deleted_at as string | undefined,
  label: dict.label as string,
  active: dict.active as boolean
})

export const fromAssetType = (assetType: AssetType): Dictionary => ({
  id: assetType.id,
  created_at: assetType.createdAt,
  updated_at: assetType.updatedAt,
  deleted_at: assetType.deletedAt,
  label: assetType.label,
  active: assetType.active
})

export const toAsset = (dict: Dictionary): Asset => ({
  id: dict.id as string,
  createdAt: dict.created_at as string,
  updatedAt: dict.updated_at as string,
  deletedAt: dict.deleted_at as string | undefined,
  type: dict.type_id as string,
  notes: (dict.notes as Dictionary[] | undefined ?? []).map(toNote),
  label: dict.label as string,
  description: dict.description as string | undefined,
  serialNumber: dict.serial_number as string | undefined,
  status: dict.status as Asset['status']
})

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
