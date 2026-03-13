/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Asset domain adapter                                                         ║
║ Serialization for asset topic abstractions.                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Serializes between Dictionary and AssetType and Asset domain types.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toAssetType    Deserialize AssetType from a storage dictionary.
fromAssetType  Serialize AssetType to a storage dictionary.
toAsset        Deserialize Asset from a storage dictionary.
fromAsset      Serialize Asset to a storage dictionary.
*/

import type { AssociationOne, CompositionMany, Dictionary, Id, When } from '@core/std'
import type { Asset, AssetStatus, AssetType } from '@domain/abstractions/asset.ts'
import type { Note } from '@domain/abstractions/common.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

/** Deserialize AssetType from a storage dictionary. */
export const toAssetType = (dict: Dictionary): AssetType => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  label: dict.label as string,
  active: dict.active as boolean
})

/** Serialize AssetType to a storage dictionary. */
export const fromAssetType = (assetType: AssetType): Dictionary => ({
  id: assetType.id,
  created_at: assetType.createdAt,
  updated_at: assetType.updatedAt,
  deleted_at: assetType.deletedAt,
  label: assetType.label,
  active: assetType.active
})

/** Deserialize Asset from a storage dictionary. */
export const toAsset = (dict: Dictionary): Asset => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  type: dict.type_id as AssociationOne<AssetType>,
  notes: (dict.notes as Dictionary[]).map(toNote) as CompositionMany<Note>,
  label: dict.label as string,
  description: dict.description as string | undefined,
  serialNumber: dict.serial_number as string | undefined,
  status: dict.status as AssetStatus
})

/** Serialize Asset to a storage dictionary. */
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
