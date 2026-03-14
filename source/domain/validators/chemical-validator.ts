/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Chemical protocol validators                                                ║
║ Boundary validation for chemical protocol payloads                          ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update payloads for chemical protocol contracts.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateChemicalCreate              Validate ChemicalCreate payloads.
validateChemicalUpdate              Validate ChemicalUpdate payloads.
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
import { CHEMICAL_SIGNAL_WORDS, CHEMICAL_USAGES } from '@domain/abstractions/chemical.ts'
import type { ChemicalCreate, ChemicalUpdate } from '@domain/protocols/chemical-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validate ChemicalCreate payloads. */
export const validateChemicalCreate = (input: ChemicalCreate): ExpectResult =>
  expectValid(
    expectCompositionMany(input.labels, 'labels', isObject),
    expectCompositionMany(input.notes, 'notes', isObject),
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
    expectCompositionMany(input.labels, 'labels', isObject, true),
    expectCompositionMany(input.notes, 'notes', isObject, true),
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

const isObject = (value: unknown): value is object =>
  value !== null && typeof value === 'object'
