/**
 * Validators for Chemical boundary inputs.
 */

import { isNonEmptyString } from '@core-std'
import type {
  ChemicalCreateInput,
  ChemicalUpdateInput
} from '@domain/protocols/chemical-protocol.ts'

/** Validate input for creating a Chemical; returns an error message or null. */
export const validateChemicalCreate = (input: ChemicalCreateInput): string | null => {
  if (!isNonEmptyString(input.name)) return 'name is required'
  if (!isNonEmptyString(input.usage)) return 'usage is required'
  if (typeof input.restrictedUse !== 'boolean') {
    return 'restrictedUse is required and must be a boolean'
  }
  return null
}

/** Validate input for updating a Chemical; returns an error message or null. */
export const validateChemicalUpdate = (input: ChemicalUpdateInput): string | null => {
  if (!isNonEmptyString(input.id)) return 'id is required'
  if (input.name !== undefined && !isNonEmptyString(input.name)) {
    return 'name must be a non-empty string'
  }
  if (input.usage !== undefined && !isNonEmptyString(input.usage)) {
    return 'usage must be a non-empty string'
  }
  if (input.restrictedUse !== undefined && typeof input.restrictedUse !== 'boolean') {
    return 'restrictedUse must be a boolean'
  }
  return null
}
