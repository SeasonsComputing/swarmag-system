/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Chemical protocol validators                                                 ║
║ Boundary validation for chemical protocol payloads.                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for chemical abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateChemicalCreate(input)  Validate ChemicalCreate payloads.
validateChemicalUpdate(input)  Validate ChemicalUpdate payloads.
isChemicalLabel(v)             Guard for ChemicalLabel object values.
*/

import {
  expectBoolean,
  expectCompositionMany,
  expectConstEnum,
  expectId,
  expectNonEmptyString,
  expectPositiveNumber,
  type ExpectResult,
  expectValid
} from '@core/std'
import {
  CHEMICAL_SIGNAL_WORDS,
  CHEMICAL_USAGES,
  type ChemicalLabel
} from '@domain/abstractions/chemical.ts'
import type { ChemicalCreate, ChemicalUpdate } from '@domain/protocols/chemical-protocol.ts'
import { isNote } from '@domain/validators/common-validator.ts'

/** Validate ChemicalCreate payloads. */
export const validateChemicalCreate = (input: ChemicalCreate): ExpectResult =>
  expectValid(
    expectCompositionMany(input.labels, 'labels', isChemicalLabel),
    expectCompositionMany(input.notes, 'notes', isNote),
    expectNonEmptyString(input.name, 'name'),
    expectNonEmptyString(input.epaNumber, 'epaNumber', true),
    expectConstEnum(input.usage, 'usage', CHEMICAL_USAGES),
    expectConstEnum(input.signalWord, 'signalWord', CHEMICAL_SIGNAL_WORDS),
    expectBoolean(input.restrictedUse, 'restrictedUse'),
    expectPositiveNumber(input.reEntryIntervalHours, 'reEntryIntervalHours', true),
    expectNonEmptyString(input.storageLocation, 'storageLocation', true),
    expectNonEmptyString(input.sdsUrl, 'sdsUrl', true)
  )

/** Validate ChemicalUpdate payloads. */
export const validateChemicalUpdate = (input: ChemicalUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectCompositionMany(input.labels, 'labels', isChemicalLabel, true),
    expectCompositionMany(input.notes, 'notes', isNote, true),
    expectNonEmptyString(input.name, 'name', true),
    expectNonEmptyString(input.epaNumber, 'epaNumber', true),
    expectConstEnum(input.usage, 'usage', CHEMICAL_USAGES, true),
    expectConstEnum(input.signalWord, 'signalWord', CHEMICAL_SIGNAL_WORDS, true),
    expectBoolean(input.restrictedUse, 'restrictedUse', true),
    expectPositiveNumber(input.reEntryIntervalHours, 'reEntryIntervalHours', true),
    expectNonEmptyString(input.storageLocation, 'storageLocation', true),
    expectNonEmptyString(input.sdsUrl, 'sdsUrl', true)
  )

/** Guard for ChemicalLabel values. */
export const isChemicalLabel = (v: unknown): v is ChemicalLabel => {
  if (v === null || typeof v !== 'object') return false
  const label = v as ChemicalLabel
  return expectValid(
    expectNonEmptyString(label.url, 'url'),
    expectNonEmptyString(label.description, 'description', true)
  ) === null
}
