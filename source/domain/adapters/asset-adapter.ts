/**
 * Asset domain adapters.
 */

import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type { Asset, AssetStatus, AssetType } from '@domain/abstractions/asset.ts'
import type { Note } from '@domain/abstractions/common.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

/** Create an AssetType from its dictionary representation. */
export const toAssetType = (dict: Dictionary): AssetType => {
  if (!dict.id) return notValid('AssetType dictionary missing required field: id')
  if (!dict.label) return notValid('AssetType dictionary missing required field: label')
  if (dict.active === undefined) {
    return notValid('AssetType dictionary missing required field: active')
  }
  if (!dict.created_at) {
    return notValid('AssetType dictionary missing required field: created_at')
  }
  if (!dict.updated_at) {
    return notValid('AssetType dictionary missing required field: updated_at')
  }

  return {
    id: dict.id as string,
    label: dict.label as string,
    active: dict.active as boolean,
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation from an AssetType. */
export const fromAssetType = (assetType: AssetType): Dictionary => ({
  id: assetType.id,
  label: assetType.label,
  active: assetType.active,
  created_at: assetType.createdAt,
  updated_at: assetType.updatedAt,
  deleted_at: assetType.deletedAt
})

/** Create an Asset from its dictionary representation. */
export const toAsset = (dict: Dictionary): Asset => {
  if (!dict.id) return notValid('Asset dictionary missing required field: id')
  if (!dict.label) return notValid('Asset dictionary missing required field: label')
  if (!dict.type_id) return notValid('Asset dictionary missing required field: type_id')
  if (!dict.status) return notValid('Asset dictionary missing required field: status')
  if (!dict.notes) return notValid('Asset dictionary missing required field: notes')
  if (!dict.created_at) {
    return notValid('Asset dictionary missing required field: created_at')
  }
  if (!dict.updated_at) {
    return notValid('Asset dictionary missing required field: updated_at')
  }

  return {
    id: dict.id as string,
    label: dict.label as string,
    description: dict.description as string | undefined,
    serialNumber: dict.serial_number as string | undefined,
    type: dict.type_id as string,
    status: dict.status as AssetStatus,
    notes: (dict.notes as Note[]).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation from an Asset. */
export const fromAsset = (asset: Asset): Dictionary => ({
  id: asset.id,
  label: asset.label,
  description: asset.description,
  serial_number: asset.serialNumber,
  type_id: asset.type,
  status: asset.status,
  notes: asset.notes.map(fromNote),
  created_at: asset.createdAt,
  updated_at: asset.updatedAt,
  deleted_at: asset.deletedAt
})
