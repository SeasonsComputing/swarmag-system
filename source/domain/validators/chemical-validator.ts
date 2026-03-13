/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Chemical domain validator                                                    ║
║ Boundary validation for chemical topic abstractions.                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for Chemical.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateChemicalCreate  Validate ChemicalCreate payloads.
validateChemicalUpdate  Validate ChemicalUpdate payloads.
*/

import {
  expectBoolean,
  expectCompositionMany,
  expectConstEnum,
  type ExpectGuard,
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
import type { Note } from '@domain/abstractions/common.ts'
import type { ChemicalCreate, ChemicalUpdate } from '@domain/protocols/chemical-protocol.ts'
import { isNote } from '@domain/validators/common-validator.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validate ChemicalCreate payloads. */
export const validateChemicalCreate = (input: ChemicalCreate): ExpectResult =>
  expectValid(
    expectCompositionMany(input.labels, 'labels', isChemicalLabel),
    expectCompositionMany(input.notes, 'notes', isNote as ExpectGuard<Note>, true),
    expectNonEmptyString(input.name, 'name'),
    expectNonEmptyString(input.epaNumber, 'epaNumber', true),
    expectConstEnum(input.usage, 'usage', CHEMICAL_USAGES),
    expectConstEnum(input.signalWord, 'signalWord', CHEMICAL_SIGNAL_WORDS, true),
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
    expectCompositionMany(input.notes, 'notes', isNote as ExpectGuard<Note>, true),
    expectNonEmptyString(input.name, 'name', true),
    expectNonEmptyString(input.epaNumber, 'epaNumber', true),
    expectConstEnum(input.usage, 'usage', CHEMICAL_USAGES, true),
    expectConstEnum(input.signalWord, 'signalWord', CHEMICAL_SIGNAL_WORDS, true),
    expectBoolean(input.restrictedUse, 'restrictedUse', true),
    expectPositiveNumber(input.reEntryIntervalHours, 'reEntryIntervalHours', true),
    expectNonEmptyString(input.storageLocation, 'storageLocation', true),
    expectNonEmptyString(input.sdsUrl, 'sdsUrl', true)
  )

// ────────────────────────────────────────────────────────────────────────────
// GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isChemicalLabel: ExpectGuard<ChemicalLabel> = (v): v is ChemicalLabel =>
  v !== null && typeof v === 'object'
