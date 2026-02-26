/**
 * Asset protocol validators.
 */

import { isId, isNonEmptyString } from '@core-std'
import { ASSET_STATUSES } from '@domain/abstractions/asset.ts'
import type { AssetStatus } from '@domain/abstractions/asset.ts'
import type {
  AssetCreate,
  AssetTypeCreate,
  AssetTypeUpdate,
  AssetUpdate
} from '@domain/protocols/asset-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates AssetTypeCreate; returns error message or null. */
export const validateAssetTypeCreate = (input: AssetTypeCreate): string | null => {
  if (!isNonEmptyString(input.label)) return 'label must be a non-empty string'
  if (typeof input.active !== 'boolean') return 'active must be a boolean'
  return null
}

/** Validates AssetTypeUpdate; returns error message or null. */
export const validateAssetTypeUpdate = (input: AssetTypeUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.label !== undefined && !isNonEmptyString(input.label)) {
    return 'label must be a non-empty string'
  }
  if (input.active !== undefined && typeof input.active !== 'boolean') {
    return 'active must be a boolean'
  }
  return null
}

/** Validates AssetCreate; returns error message or null. */
export const validateAssetCreate = (input: AssetCreate): string | null => {
  if (!isNonEmptyString(input.label)) return 'label must be a non-empty string'
  if (!isId(input.type)) return 'type must be a valid Id'
  if (!ASSET_STATUSES.includes(input.status as AssetStatus)) {
    return 'status must be a valid AssetStatus'
  }
  return null
}

/** Validates AssetUpdate; returns error message or null. */
export const validateAssetUpdate = (input: AssetUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.label !== undefined && !isNonEmptyString(input.label)) {
    return 'label must be a non-empty string'
  }
  if (input.type !== undefined && !isId(input.type)) return 'type must be a valid Id'
  if (
    input.status !== undefined && !ASSET_STATUSES.includes(input.status as AssetStatus)
  ) return 'status must be a valid AssetStatus'
  return null
}
