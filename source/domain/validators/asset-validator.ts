/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Asset protocol validators                                                    ║
║ Boundary validation for asset protocol payloads.                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for asset abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateAssetTypeCreate(input)  Validate AssetTypeCreate payloads.
validateAssetTypeUpdate(input)  Validate AssetTypeUpdate payloads.
validateAssetCreate(input)  Validate AssetCreate payloads.
validateAssetUpdate(input)  Validate AssetUpdate payloads.
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
import { ASSET_STATUSES } from '@domain/abstractions/asset.ts'
import type {
  AssetCreate,
  AssetTypeCreate,
  AssetTypeUpdate,
  AssetUpdate
} from '@domain/protocols/asset-protocol.ts'
import { isNote } from '@domain/validators/common-validator.ts'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

export const validateAssetTypeCreate = (input: AssetTypeCreate): ExpectResult =>
  expectValid(
    expectNonEmptyString(input.label, 'label'),
    expectBoolean(input.active, 'active')
  )

export const validateAssetTypeUpdate = (input: AssetTypeUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectNonEmptyString(input.label, 'label', true),
    expectBoolean(input.active, 'active', true)
  )

export const validateAssetCreate = (input: AssetCreate): ExpectResult =>
  expectValid(
    expectId(input.type, 'type'),
    expectCompositionMany(input.notes, 'notes', isNote),
    expectNonEmptyString(input.label, 'label'),
    expectNonEmptyString(input.description, 'description', true),
    expectNonEmptyString(input.serialNumber, 'serialNumber', true),
    expectConstEnum(input.status, 'status', ASSET_STATUSES)
  )

export const validateAssetUpdate = (input: AssetUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectId(input.type, 'type', true),
    expectCompositionMany(input.notes, 'notes', isNote, true),
    expectNonEmptyString(input.label, 'label', true),
    expectNonEmptyString(input.description, 'description', true),
    expectNonEmptyString(input.serialNumber, 'serialNumber', true),
    expectConstEnum(input.status, 'status', ASSET_STATUSES, true)
  )
