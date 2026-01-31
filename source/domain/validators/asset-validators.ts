/**
 * Domain-level invariant validators for assets.
 */

import type { Asset } from '@domain/abstractions/asset.ts'
import { isNonEmptyString } from '@domain/validators/common-validators.ts'

/**
 * Type guard for asset status.
 * @param value - Potential status value.
 * @returns True when the value matches a known status.
 */
export const isAssetStatus = (value: unknown): value is Asset['status'] =>
  value === 'active' || value === 'maintenance' || value === 'retired' || value === 'reserved'

/** Input type for creating an asset. */
export interface AssetCreateInput {
  label: string
  description?: string
  serialNumber?: string
  type: string
  status?: Asset['status']
}

/** Input type for updating an asset. */
export interface AssetUpdateInput {
  id: string
  label?: string
  description?: string | null
  serialNumber?: string | null
  type?: string
  status?: Asset['status']
}

/**
 * Validate asset creation input.
 * @param input - Asset creation input to validate.
 * @returns Error message or null if valid.
 */
export const validateAssetCreate = (input?: AssetCreateInput | null): string | null => {
  if (!input) return 'Request body is required'
  if (!isNonEmptyString(input.label)) return 'label is required'
  if (!isNonEmptyString(input.type)) return 'type is required'
  if (input.status !== undefined && !isAssetStatus(input.status)) {
    return 'status must be active, maintenance, retired, or reserved'
  }
  return null
}

/**
 * Validate asset update input.
 * @param input - Asset update input to validate.
 * @returns Error message or null if valid.
 */
export const validateAssetUpdate = (input?: AssetUpdateInput | null): string | null => {
  if (!input) return 'Request body is required'
  if (!isNonEmptyString(input.id)) return 'id is required'
  if (input.label !== undefined && !isNonEmptyString(input.label)) return 'label cannot be empty'
  if (input.type !== undefined && !isNonEmptyString(input.type)) return 'type cannot be empty'
  if (input.status !== undefined && !isAssetStatus(input.status)) {
    return 'status must be active, maintenance, retired, or reserved'
  }
  return null
}
