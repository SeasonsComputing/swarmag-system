/**
 * Validators for the asset domain area: AssetType and Asset create and update.
 */

import type { Dictionary } from '@core-std'
import { isCompositionMany, isId, isNonEmptyString, isWhen } from '@core-std'
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
  if (!isId(input.id)) return 'id must be a valid UUID'
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
  if (!isId(input.type)) return 'type must be a valid UUID'
  if (!isAssetStatus(input.status)) return 'status must be a valid AssetStatus'
  if (!isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

/** Validates AssetUpdate; returns error message or null. */
export const validateAssetUpdate = (input: AssetUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid UUID'
  if (input.label !== undefined && !isNonEmptyString(input.label)) {
    return 'label must be a non-empty string'
  }
  if (input.type !== undefined && !isId(input.type)) {
    return 'type must be a valid UUID'
  }
  if (input.status !== undefined && !isAssetStatus(input.status)) {
    return 'status must be a valid AssetStatus'
  }
  if (input.notes !== undefined && !isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATOR GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isAssetStatus = (v: unknown): v is AssetStatus =>
  typeof v === 'string' && (ASSET_STATUSES as readonly string[]).includes(v)

const isNote = (v: unknown): v is Dictionary => {
  const d = v as Dictionary
  return isNonEmptyString(d.content) && isWhen(d.createdAt)
    && Array.isArray(d.attachments)
}
