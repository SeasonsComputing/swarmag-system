/**
 * Domain-level invariant validators for chemicals.
 */

import type { Chemical } from '@domain/abstractions/chemical.ts'
import type {
  ChemicalCreateInput,
  ChemicalUpdateInput
} from '@domain/protocol/chemical-protocol.ts'
import { isNonEmptyString } from './helper-validator.ts'

export type { ChemicalCreateInput, ChemicalUpdateInput }

/**
 * Type guard for chemical usage.
 * @param value - Potential usage value.
 * @returns True when the value matches a known usage.
 */
export const isChemicalUsage = (value: unknown): value is Chemical['usage'] =>
  value === 'herbicide'
  || value === 'pesticide'
  || value === 'fertilizer'
  || value === 'fungicide'
  || value === 'adjuvant'

/**
 * Type guard for chemical signal word.
 * @param value - Potential signal word value.
 * @returns True when the value matches a known signal word.
 */
export const isSignalWord = (value: unknown): value is Chemical['signalWord'] =>
  value === undefined || value === null || value === 'danger' || value === 'warning'
  || value === 'caution'

/**
 * Validate chemical creation input.
 * @param input - Chemical creation input to validate.
 * @returns Error message or null if valid.
 */
export const validateChemicalCreate = (input?: ChemicalCreateInput | null): string | null => {
  if (!input) return 'Request body is required'
  if (!isNonEmptyString(input.name)) return 'name is required'
  if (!isChemicalUsage(input.usage)) {
    return 'usage must be herbicide, pesticide, fertilizer, fungicide, or adjuvant'
  }
  if (typeof input.restrictedUse !== 'boolean') return 'restrictedUse is required'
  if (input.signalWord !== undefined && !isSignalWord(input.signalWord)) {
    return 'signalWord must be danger, warning, or caution'
  }
  return null
}

/**
 * Validate chemical update input.
 * @param input - Chemical update input to validate.
 * @returns Error message or null if valid.
 */
export const validateChemicalUpdate = (input?: ChemicalUpdateInput | null): string | null => {
  if (!input) return 'Request body is required'
  if (!isNonEmptyString(input.id)) return 'id is required'
  if (input.name !== undefined && !isNonEmptyString(input.name)) {
    return 'name cannot be empty'
  }
  if (input.usage !== undefined && !isChemicalUsage(input.usage)) {
    return 'usage must be herbicide, pesticide, fertilizer, fungicide, or adjuvant'
  }
  if (
    input.signalWord !== undefined && input.signalWord !== null
    && !isSignalWord(input.signalWord)
  ) {
    return 'signalWord must be danger, warning, or caution'
  }
  return null
}
