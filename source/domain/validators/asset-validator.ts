/**
 * Validators for Asset boundary inputs.
 */

import { isId, isNonEmptyString } from '@core-std'
import type { AssetCreateInput, AssetUpdateInput } from '@domain/protocols/asset-protocol.ts'

/** Validate input for creating an Asset; returns an error message or null. */
export const validateAssetCreate = (input: AssetCreateInput): string | null => {
  if (!isNonEmptyString(input.label)) return 'label is required'
  if (!isNonEmptyString(input.type)) return 'type is required'
  if (!isId(input.type)) return 'type must be a valid Id'
  if (!isNonEmptyString(input.status)) return 'status is required'
  return null
}

/** Validate input for updating an Asset; returns an error message or null. */
export const validateAssetUpdate = (input: AssetUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.label !== undefined && !isNonEmptyString(input.label)) {
    return 'label must be a non-empty string'
  }
  if (input.type !== undefined && !isId(input.type)) return 'type must be a valid Id'
  if (input.status !== undefined && !isNonEmptyString(input.status)) {
    return 'status must be a non-empty string'
  }
  return null
}
