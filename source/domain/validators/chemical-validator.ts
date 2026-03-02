/**
 * Validators for the chemical domain area: Chemical create and update.
 */

import type { Dictionary } from '@core-std'
import { isCompositionMany, isId, isNonEmptyString, isWhen } from '@core-std'
import type { ChemicalSignalWord, ChemicalUsage } from '@domain/abstractions/chemical.ts'
import { CHEMICAL_SIGNAL_WORDS, CHEMICAL_USAGES } from '@domain/abstractions/chemical.ts'
import type {
  ChemicalCreate,
  ChemicalUpdate
} from '@domain/protocols/chemical-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates ChemicalCreate; returns error message or null. */
export const validateChemicalCreate = (input: ChemicalCreate): string | null => {
  if (!isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (!isChemicalUsage(input.usage)) return 'usage must be a valid ChemicalUsage'
  if (typeof input.restrictedUse !== 'boolean') return 'restrictedUse must be a boolean'
  if (input.signalWord !== undefined && !isChemicalSignalWord(input.signalWord)) {
    return 'signalWord must be a valid ChemicalSignalWord'
  }
  if (!isCompositionMany(input.labels, isChemicalLabel)) {
    return 'labels must be an array of valid ChemicalLabel values'
  }
  if (!isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

/** Validates ChemicalUpdate; returns error message or null. */
export const validateChemicalUpdate = (input: ChemicalUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid UUID'
  if (input.name !== undefined && !isNonEmptyString(input.name)) {
    return 'name must be a non-empty string'
  }
  if (input.usage !== undefined && !isChemicalUsage(input.usage)) {
    return 'usage must be a valid ChemicalUsage'
  }
  if (input.restrictedUse !== undefined && typeof input.restrictedUse !== 'boolean') {
    return 'restrictedUse must be a boolean'
  }
  if (input.signalWord !== undefined && !isChemicalSignalWord(input.signalWord)) {
    return 'signalWord must be a valid ChemicalSignalWord'
  }
  if (input.labels !== undefined && !isCompositionMany(input.labels, isChemicalLabel)) {
    return 'labels must be an array of valid ChemicalLabel values'
  }
  if (input.notes !== undefined && !isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATOR GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isChemicalUsage = (v: unknown): v is ChemicalUsage =>
  typeof v === 'string' && (CHEMICAL_USAGES as readonly string[]).includes(v)

const isChemicalSignalWord = (v: unknown): v is ChemicalSignalWord =>
  typeof v === 'string' && (CHEMICAL_SIGNAL_WORDS as readonly string[]).includes(v)

const isChemicalLabel = (v: unknown): v is Dictionary => {
  const d = v as Dictionary
  return isNonEmptyString(d.url)
}

const isNote = (v: unknown): v is Dictionary => {
  const d = v as Dictionary
  return isNonEmptyString(d.content) && isWhen(d.createdAt)
    && Array.isArray(d.attachments)
}
