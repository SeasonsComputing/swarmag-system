/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Asset protocol validators                                                   ║
║ Boundary validation for asset protocol payloads                             ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update payloads for asset topic protocol contracts.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateAssetTypeCreate             Validate AssetTypeCreate payloads.
validateAssetTypeUpdate             Validate AssetTypeUpdate payloads.
validateAssetCreate                 Validate AssetCreate payloads.
validateAssetUpdate                 Validate AssetUpdate payloads.
*/

import {
  expectBoolean,
  expectCompositionMany,
  expectConstEnum,
  expectId,
  expectNonEmptyString,
  type ExpectResult,
  expectValid
} from '@core/std'
import { ASSET_STATUSES, type AssetStatus } from '@domain/abstractions/asset.ts'
import type {
  AssetCreate,
  AssetTypeCreate,
  AssetTypeUpdate,
  AssetUpdate
} from '@domain/protocols/asset-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validate AssetTypeCreate payloads. */
export const validateAssetTypeCreate = (input: AssetTypeCreate): ExpectResult =>
  expectValid(
    expectNonEmptyString(input.label, 'label'),
    expectBoolean(input.active, 'active')
  )

/** Validate AssetTypeUpdate payloads. */
export const validateAssetTypeUpdate = (input: AssetTypeUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectNonEmptyString(input.label, 'label', true),
    expectBoolean(input.active, 'active', true)
  )

/** Validate AssetCreate payloads. */
export const validateAssetCreate = (input: AssetCreate): ExpectResult =>
  expectValid(
    expectId(input.type, 'type'),
    expectCompositionMany(input.notes, 'notes', isObject),
    expectNonEmptyString(input.label, 'label'),
    expectNonEmptyString(input.description, 'description', true),
    expectNonEmptyString(input.serialNumber, 'serialNumber', true),
    expectConstEnum(input.status, 'status', ASSET_STATUSES)
  )

/** Validate AssetUpdate payloads. */
export const validateAssetUpdate = (input: AssetUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectId(input.type, 'type', true),
    expectCompositionMany(input.notes, 'notes', isObject, true),
    expectNonEmptyString(input.label, 'label', true),
    expectNonEmptyString(input.description, 'description', true),
    expectNonEmptyString(input.serialNumber, 'serialNumber', true),
    expectConstEnum(input.status, 'status', ASSET_STATUSES, true)
  )

// ────────────────────────────────────────────────────────────────────────────
// GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isObject = (value: unknown): value is AssetStatus =>
  value !== null && typeof value === 'object'
