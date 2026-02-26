/**
 * Asset protocol validator
 */

import { isId, isNonEmptyString } from '@core-std'
import type {
  AssetCreateInput,
  AssetTypeCreateInput,
  AssetTypeUpdateInput,
  AssetUpdateInput
} from '@domain/protocols/asset-protocol.ts'

const ASSET_STATUSES = ['active', 'maintenance', 'retired', 'reserved'] as const

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates AssetTypeCreateInput; returns error message or null. */
export const validateAssetTypeCreate = (input: AssetTypeCreateInput): string | null => {
  if (!isNonEmptyString(input.label)) return 'label must be a non-empty string'
  if (typeof input.active !== 'boolean') return 'active must be a boolean'
  return null
}

/** Validates AssetTypeUpdateInput; returns error message or null. */
export const validateAssetTypeUpdate = (input: AssetTypeUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.label !== undefined && !isNonEmptyString(input.label)) {
    return 'label must be a non-empty string'
  }
  if (input.active !== undefined && typeof input.active !== 'boolean') {
    return 'active must be a boolean'
  }
  return null
}

/** Validates AssetCreateInput; returns error message or null. */
export const validateAssetCreate = (input: AssetCreateInput): string | null => {
  if (!isNonEmptyString(input.label)) return 'label must be a non-empty string'
  if (!isId(input.type)) return 'type must be a valid Id'
  if (!ASSET_STATUSES.includes(input.status)) {
    return `status must be one of: ${ASSET_STATUSES.join(', ')}`
  }
  return null
}

/** Validates AssetUpdateInput; returns error message or null. */
export const validateAssetUpdate = (input: AssetUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.label !== undefined && !isNonEmptyString(input.label)) {
    return 'label must be a non-empty string'
  }
  if (input.type !== undefined && !isId(input.type)) return 'type must be a valid Id'
  if (input.status !== undefined && !ASSET_STATUSES.includes(input.status)) {
    return `status must be one of: ${ASSET_STATUSES.join(', ')}`
  }
  return null
}
