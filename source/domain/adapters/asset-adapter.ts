/**
 * Adapter for converting between Dictionary (storage) and Asset domain abstractions.
 * Maps snake_case column names to camelCase domain fields and back.
 */
import type { Dictionary } from '@core-std'
import type { AssetType, AssetStatus, Asset } from '@domain/abstractions/asset.ts'

/** Converts a storage dictionary to an AssetType domain object. */
export const toAssetType = (dict: Dictionary): AssetType => {
  if (!dict['id']) throw new Error('AssetType dictionary missing required field: id')
  if (!dict['label']) throw new Error('AssetType dictionary missing required field: label')
  if (dict['active'] === undefined || dict['active'] === null) throw new Error('AssetType dictionary missing required field: active')
  if (!dict['created_at']) throw new Error('AssetType dictionary missing required field: created_at')
  if (!dict['updated_at']) throw new Error('AssetType dictionary missing required field: updated_at')

  return {
    id: dict['id'] as string,
    label: dict['label'] as string,
    active: dict['active'] as boolean,
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined,
  }
}

/** Converts an AssetType domain object to a storage dictionary. */
export const fromAssetType = (assetType: AssetType): Dictionary => ({
  id: assetType.id,
  label: assetType.label,
  active: assetType.active,
  created_at: assetType.createdAt,
  updated_at: assetType.updatedAt,
  deleted_at: assetType.deletedAt,
})

/** Converts a storage dictionary to an Asset domain object. */
export const toAsset = (dict: Dictionary): Asset => {
  if (!dict['id']) throw new Error('Asset dictionary missing required field: id')
  if (!dict['label']) throw new Error('Asset dictionary missing required field: label')
  if (!dict['type']) throw new Error('Asset dictionary missing required field: type')
  if (!dict['status']) throw new Error('Asset dictionary missing required field: status')
  if (!dict['created_at']) throw new Error('Asset dictionary missing required field: created_at')
  if (!dict['updated_at']) throw new Error('Asset dictionary missing required field: updated_at')

  return {
    id: dict['id'] as string,
    label: dict['label'] as string,
    description: dict['description'] as string | undefined,
    serialNumber: dict['serial_number'] as string | undefined,
    type: dict['type'] as string,
    status: dict['status'] as AssetStatus,
    notes: (dict['notes'] ?? []) as Asset['notes'],
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined,
  }
}

/** Converts an Asset domain object to a storage dictionary. */
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
  deleted_at: asset.deletedAt,
})
