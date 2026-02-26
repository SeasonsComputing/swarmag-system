/**
 * Chemical protocol validators.
 */

import { isId, isNonEmptyString } from '@core-std'
import { CHEMICAL_USAGES } from '@domain/abstractions/chemical.ts'
import type { ChemicalUsage } from '@domain/abstractions/chemical.ts'
import type { ChemicalCreate, ChemicalUpdate } from '@domain/protocols/chemical-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates ChemicalCreate; returns error message or null. */
export const validateChemicalCreate = (input: ChemicalCreate): string | null => {
  if (!isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (!CHEMICAL_USAGES.includes(input.usage as ChemicalUsage)) return 'usage must be a valid ChemicalUsage'
  if (typeof input.restrictedUse !== 'boolean') return 'restrictedUse must be a boolean'
  return null
}

/** Validates ChemicalUpdate; returns error message or null. */
export const validateChemicalUpdate = (input: ChemicalUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.name !== undefined && !isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (input.usage !== undefined && !CHEMICAL_USAGES.includes(input.usage as ChemicalUsage)) return 'usage must be a valid ChemicalUsage'
  if (input.restrictedUse !== undefined && typeof input.restrictedUse !== 'boolean') return 'restrictedUse must be a boolean'
  return null
}
