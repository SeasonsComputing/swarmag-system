/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Service protocol validators                                                 ║
║ Boundary validation for service protocol payloads                           ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update payloads for service protocol contracts.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateServiceCreate               Validate ServiceCreate payloads.
validateServiceUpdate               Validate ServiceUpdate payloads.
validateServiceRequiredAssetTypeCreate  Validate ServiceRequiredAssetTypeCreate payloads.
*/

import {
  expectCompositionMany,
  expectConstEnum,
  expectId,
  expectNonEmptyString,
  type ExpectResult,
  expectValid
} from '@core/std'
import { SERVICE_CATEGORIES } from '@domain/abstractions/service.ts'
import type {
  ServiceCreate,
  ServiceRequiredAssetTypeCreate,
  ServiceUpdate
} from '@domain/protocols/service-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validate ServiceCreate payloads. */
export const validateServiceCreate = (input: ServiceCreate): ExpectResult =>
  expectValid(
    expectCompositionMany(input.notes, 'notes', isObject),
    expectNonEmptyString(input.name, 'name'),
    expectNonEmptyString(input.sku, 'sku'),
    expectNonEmptyString(input.description, 'description', true),
    expectConstEnum(input.category, 'category', SERVICE_CATEGORIES),
    expectCompositionMany(input.tagsWorkflowCandidates, 'tagsWorkflowCandidates', isString)
  )

/** Validate ServiceUpdate payloads. */
export const validateServiceUpdate = (input: ServiceUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectCompositionMany(input.notes, 'notes', isObject, true),
    expectNonEmptyString(input.name, 'name', true),
    expectNonEmptyString(input.sku, 'sku', true),
    expectNonEmptyString(input.description, 'description', true),
    expectConstEnum(input.category, 'category', SERVICE_CATEGORIES, true),
    expectCompositionMany(
      input.tagsWorkflowCandidates,
      'tagsWorkflowCandidates',
      isString,
      true
    )
  )

/** Validate ServiceRequiredAssetTypeCreate payloads. */
export const validateServiceRequiredAssetTypeCreate = (
  input: ServiceRequiredAssetTypeCreate
): ExpectResult =>
  expectValid(
    expectId(input.serviceId, 'serviceId'),
    expectId(input.assetTypeId, 'assetTypeId')
  )

// ────────────────────────────────────────────────────────────────────────────
// GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isObject = (value: unknown): value is object => value !== null && typeof value === 'object'
const isString = (value: unknown): value is string => typeof value === 'string'
