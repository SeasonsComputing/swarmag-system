/**
 * Adapters for converting between Dictionary and Asset domain abstractions.
 */

import type { Dictionary } from '@core-std'
import { notValid } from '@core-std'
import type { Asset, AssetType } from '@domain/abstractions/asset.ts'

/** Convert a Dictionary to an AssetType domain object. */
export const toAssetType = (dict: Dictionary): AssetType => {
  if (!dict['id']) notValid('AssetType dictionary missing required field: id')
  if (!dict['label']) notValid('AssetType dictionary missing required field: label')
  if (dict['active'] === undefined || dict['active'] === null) {
    notValid('AssetType dictionary missing required field: active')
  }
  if (!dict['created_at']) notValid('AssetType dictionary missing required field: created_at')
  if (!dict['updated_at']) notValid('AssetType dictionary missing required field: updated_at')

  return {
    id: dict['id'] as string,
    label: dict['label'] as string,
    active: dict['active'] as boolean,
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined
  }
}

/** Convert an AssetType domain object to a Dictionary. */
export const fromAssetType = (assetType: AssetType): Dictionary => ({
  id: assetType.id,
  label: assetType.label,
  active: assetType.active,
  created_at: assetType.createdAt,
  updated_at: assetType.updatedAt,
  deleted_at: assetType.deletedAt
})

/** Convert a Dictionary to an Asset domain object. */
export const toAsset = (dict: Dictionary): Asset => {
  if (!dict['id']) notValid('Asset dictionary missing required field: id')
  if (!dict['label']) notValid('Asset dictionary missing required field: label')
  if (!dict['type']) notValid('Asset dictionary missing required field: type')
  if (!dict['status']) notValid('Asset dictionary missing required field: status')
  if (!dict['created_at']) notValid('Asset dictionary missing required field: created_at')
  if (!dict['updated_at']) notValid('Asset dictionary missing required field: updated_at')

  return {
    id: dict['id'] as string,
    label: dict['label'] as string,
    description: dict['description'] as string | undefined,
    serialNumber: dict['serial_number'] as string | undefined,
    type: dict['type'] as string,
    status: dict['status'] as Asset['status'],
    notes: (dict['notes'] ?? []) as Asset['notes'],
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined
  }
}

/** Convert an Asset domain object to a Dictionary. */
export const fromAsset = (asset: Asset): Dictionary => ({
  id: asset.id,
  label: asset.label,
  description: asset.description,
  serial_number: asset.serialNumber,
  type: asset.type,
  status: asset.status,
  notes: asset.notes,
  created_at: asset.createdAt,
  updated_at: asset.updatedAt,
  deleted_at: asset.deletedAt
})
