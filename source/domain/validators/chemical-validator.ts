/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Chemical protocol validator                                                ║
║ Boundary validation for chemical protocol payloads.                        ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for chemical topic abstractions.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
validateChemicalCreate(input)
  Validate ChemicalCreate payloads.

validateChemicalUpdate(input)
  Validate ChemicalUpdate payloads.
*/

import {
  type Dictionary,
  isCompositionMany,
  isId,
  isNonEmptyString,
  isPositiveNumber
} from '@core-std'
import {
  CHEMICAL_SIGNAL_WORDS,
  CHEMICAL_USAGES,
  type ChemicalLabel,
  type ChemicalSignalWord,
  type ChemicalUsage
} from '@domain/abstractions/chemical.ts'
import type {
  ChemicalCreate,
  ChemicalUpdate
} from '@domain/protocols/chemical-protocol.ts'
import { isNote } from '@domain/validators/common-validator.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates ChemicalCreate; returns error message or null. */
export const validateChemicalCreate = (input: ChemicalCreate): string | null => {
  if (!isCompositionMany(input.labels, isChemicalLabel)) {
    return 'labels must be an array of valid ChemicalLabel values'
  }
  if (!isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  if (!isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (input.epaNumber !== undefined && !isNonEmptyString(input.epaNumber)) {
    return 'epaNumber must be a non-empty string when provided'
  }
  if (!CHEMICAL_USAGES.includes(input.usage as ChemicalUsage)) {
    return 'usage must be a valid ChemicalUsage'
  }
  if (
    input.signalWord !== undefined
    && !CHEMICAL_SIGNAL_WORDS.includes(input.signalWord as ChemicalSignalWord)
  ) {
    return 'signalWord must be a valid ChemicalSignalWord when provided'
  }
  if (typeof input.restrictedUse !== 'boolean') {
    return 'restrictedUse must be a boolean'
  }
  if (
    input.reEntryIntervalHours !== undefined
    && !isPositiveNumber(input.reEntryIntervalHours)
  ) {
    return 'reEntryIntervalHours must be a positive number when provided'
  }
  if (input.storageLocation !== undefined && !isNonEmptyString(input.storageLocation)) {
    return 'storageLocation must be a non-empty string when provided'
  }
  if (input.sdsUrl !== undefined && !isNonEmptyString(input.sdsUrl)) {
    return 'sdsUrl must be a non-empty string when provided'
  }
  return null
}

/** Validates ChemicalUpdate; returns error message or null. */
export const validateChemicalUpdate = (input: ChemicalUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'

  if (input.labels !== undefined && !isCompositionMany(input.labels, isChemicalLabel)) {
    return 'labels must be an array of valid ChemicalLabel values when provided'
  }
  if (input.notes !== undefined && !isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values when provided'
  }
  if (input.name !== undefined && !isNonEmptyString(input.name)) {
    return 'name must be a non-empty string when provided'
  }
  if (input.epaNumber !== undefined && !isNonEmptyString(input.epaNumber)) {
    return 'epaNumber must be a non-empty string when provided'
  }
  if (
    input.usage !== undefined
    && !CHEMICAL_USAGES.includes(input.usage as ChemicalUsage)
  ) {
    return 'usage must be a valid ChemicalUsage when provided'
  }
  if (
    input.signalWord !== undefined
    && !CHEMICAL_SIGNAL_WORDS.includes(input.signalWord as ChemicalSignalWord)
  ) {
    return 'signalWord must be a valid ChemicalSignalWord when provided'
  }
  if (input.restrictedUse !== undefined && typeof input.restrictedUse !== 'boolean') {
    return 'restrictedUse must be a boolean when provided'
  }
  if (
    input.reEntryIntervalHours !== undefined
    && !isPositiveNumber(input.reEntryIntervalHours)
  ) {
    return 'reEntryIntervalHours must be a positive number when provided'
  }
  if (input.storageLocation !== undefined && !isNonEmptyString(input.storageLocation)) {
    return 'storageLocation must be a non-empty string when provided'
  }
  if (input.sdsUrl !== undefined && !isNonEmptyString(input.sdsUrl)) {
    return 'sdsUrl must be a non-empty string when provided'
  }
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ────────────────────────────────────────────────────────────────────────────

const isChemicalLabel = (value: unknown): value is ChemicalLabel => {
  if (typeof value !== 'object' || value === null) return false

  const data = value as Dictionary

  if (!isNonEmptyString(data.url)) return false
  if (data.description !== undefined && !isNonEmptyString(data.description)) return false

  return true
}
