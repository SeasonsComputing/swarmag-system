/**
 * Mappers for converting between Supabase asset rows and domain Assets.
 */

import type { Dictionary } from '@core-std'
import type { Asset, AssetType } from '@domain/abstractions/asset.ts'

/**
 * Type guard for asset status.
 * @param value - Potential status value.
 * @returns True when the value matches a known status.
 */
export const isAssetStatus = (value: unknown): value is Asset['status'] =>
  value === 'active' || value === 'maintenance' || value === 'retired' || value === 'reserved'

/** Map a domain Asset into a Dictionary shape. */
export const assetToRow = (asset: Asset) => ({
  id: asset.id,
  label: asset.label,
  description: asset.description ?? null,
  serial_number: asset.serialNumber ?? null,
  type: asset.type,
  status: asset.status,
  attachments: asset.attachments ?? null,
  created_at: asset.createdAt,
  updated_at: asset.updatedAt,
  payload: asset
})

/**
 * Convert a Dictionary into an Asset domain model.
 * Payload is truth - if present, use it directly.
 * Falls back to column mapping for legacy records.
 * @param row - The database row to convert.
 * @returns The mapped Asset object.
 * @throws Error if required fields are missing.
 */
export const rowToAsset = (row: unknown): Asset => {
  if (!row || typeof row !== 'object') {
    throw new Error('Asset row is missing required fields')
  }

  const record = row as Dictionary

  // Payload as truth - direct cast if present
  if (record.payload && typeof record.payload === 'object') {
    const payload = record.payload as Dictionary
    if (
      typeof payload.id === 'string' && typeof payload.label === 'string' && typeof payload
          .type === 'string'
      && isAssetStatus(payload.status)
    ) {
      return payload as unknown as Asset
    }
  }

  // Legacy fallback - map from columns
  const id = record.id as string
  const label = record.label as string
  const type = record.type as string
  const status = record.status

  if (!id || !label || !type || !isAssetStatus(status)) {
    throw new Error('Asset row is missing required fields')
  }

  return {
    id,
    label,
    description: (record.description ?? undefined) as string | undefined,
    serialNumber: (record.serial_number ?? record.serialNumber ?? undefined) as
      | string
      | undefined,
    type,
    status,
    attachments: Array.isArray(record.attachments) ? record.attachments : undefined,
    createdAt: (record.created_at ?? record.createdAt) as string,
    updatedAt: (record.updated_at ?? record.updatedAt) as string
  }
}

/** Map a domain AssetType into a Dictionary shape. */
export const assetTypeToRow = (assetType: AssetType) => ({
  id: assetType.id,
  label: assetType.label,
  active: assetType.active,
  created_at: assetType.createdAt,
  updated_at: assetType.updatedAt,
  payload: assetType
})

/**
 * Convert a Dictionary into an AssetType domain model.
 * @param row - The database row to convert.
 * @returns The mapped AssetType object.
 * @throws Error if required fields are missing.
 */
export const rowToAssetType = (row: unknown): AssetType => {
  if (!row || typeof row !== 'object') {
    throw new Error('AssetType row is missing required fields')
  }

  const record = row as Dictionary

  // Payload as truth - direct cast if present
  if (record.payload && typeof record.payload === 'object') {
    const payload = record.payload as Dictionary
    if (
      typeof payload.id === 'string' && typeof payload.label === 'string'
      && typeof payload.active === 'boolean'
    ) {
      return payload as unknown as AssetType
    }
  }

  // Legacy fallback - map from columns
  const id = record.id as string
  const label = record.label as string
  const active = record.active

  if (!id || !label || typeof active !== 'boolean') {
    throw new Error('AssetType row is missing required fields')
  }

  return {
    id,
    label,
    active,
    createdAt: (record.created_at ?? record.createdAt) as string,
    updatedAt: (record.updated_at ?? record.updatedAt) as string
  }
}
