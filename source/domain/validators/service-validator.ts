/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Service domain validator                                                     ║
║ Boundary validation for service topic abstractions.                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for Service and the
ServiceRequiredAssetType junction.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateServiceCreate                   Validate ServiceCreate payloads.
validateServiceUpdate                   Validate ServiceUpdate payloads.
validateServiceRequiredAssetTypeCreate  Validate ServiceRequiredAssetTypeCreate payloads.
*/

import {
  expectCompositionMany,
  expectConstEnum,
  type ExpectGuard,
  expectId,
  expectNonEmptyString,
  type ExpectResult,
  expectValid
} from '@core/std'
import type { Note } from '@domain/abstractions/common.ts'
import { SERVICE_CATEGORIES } from '@domain/abstractions/service.ts'
import type {
  ServiceCreate,
  ServiceRequiredAssetTypeCreate,
  ServiceUpdate
} from '@domain/protocols/service-protocol.ts'
import { isNote } from '@domain/validators/common-validator.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validate ServiceCreate payloads. */
export const validateServiceCreate = (input: ServiceCreate): ExpectResult =>
  expectValid(
    expectCompositionMany(input.notes, 'notes', isNote as ExpectGuard<Note>, true),
    expectNonEmptyString(input.name, 'name'),
    expectNonEmptyString(input.sku, 'sku'),
    expectNonEmptyString(input.description, 'description', true),
    expectConstEnum(input.category, 'category', SERVICE_CATEGORIES),
    expectCompositionMany(
      input.tagsWorkflowCandidates,
      'tagsWorkflowCandidates',
      isString,
      true
    )
  )

/** Validate ServiceUpdate payloads. */
export const validateServiceUpdate = (input: ServiceUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectCompositionMany(input.notes, 'notes', isNote as ExpectGuard<Note>, true),
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

const isString: ExpectGuard<string> = (v): v is string => typeof v === 'string'
