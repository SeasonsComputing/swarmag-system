/**
 * Validators for chemical protocol inputs at system boundaries.
 * Returns an error message string on failure, null on success.
 */

import { isNonEmptyString, isId } from '@core-std'
import type { ChemicalCreateInput, ChemicalUpdateInput } from '@domain/protocols/chemical-protocol.ts'

/** Validates input for creating a Chemical. */
export const validateChemicalCreate = (input: ChemicalCreateInput): string | null => {
  if (!isNonEmptyString(input.name)) return 'name is required'
  if (!isNonEmptyString(input.usage)) return 'usage is required'
  if (typeof input.restrictedUse !== 'boolean') return 'restrictedUse is required and must be a boolean'
  return null
}

/** Validates input for updating a Chemical. */
export const validateChemicalUpdate = (input: ChemicalUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.name !== undefined && !isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (input.usage !== undefined && !isNonEmptyString(input.usage)) return 'usage must be a non-empty string'
  if (input.restrictedUse !== undefined && typeof input.restrictedUse !== 'boolean') return 'restrictedUse must be a boolean'
  return null
}
