/**
 * Chemical protocol validator
 */

import { isId, isNonEmptyString } from '@core-std'
import type {
  ChemicalCreateInput,
  ChemicalUpdateInput
} from '@domain/protocols/chemical-protocol.ts'

const CHEMICAL_USAGES = [
  'herbicide',
  'pesticide',
  'fertilizer',
  'fungicide',
  'adjuvant'
] as const

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates ChemicalCreateInput; returns error message or null. */
export const validateChemicalCreate = (input: ChemicalCreateInput): string | null => {
  if (!isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (!CHEMICAL_USAGES.includes(input.usage)) {
    return `usage must be one of: ${CHEMICAL_USAGES.join(', ')}`
  }
  if (typeof input.restrictedUse !== 'boolean') return 'restrictedUse must be a boolean'
  return null
}

/** Validates ChemicalUpdateInput; returns error message or null. */
export const validateChemicalUpdate = (input: ChemicalUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.name !== undefined && !isNonEmptyString(input.name)) {
    return 'name must be a non-empty string'
  }
  if (input.usage !== undefined && !CHEMICAL_USAGES.includes(input.usage)) {
    return `usage must be one of: ${CHEMICAL_USAGES.join(', ')}`
  }
  if (input.restrictedUse !== undefined && typeof input.restrictedUse !== 'boolean') {
    return 'restrictedUse must be a boolean'
  }
  return null
}
