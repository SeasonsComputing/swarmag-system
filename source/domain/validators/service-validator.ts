/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Service protocol validators                                                  ║
║ Boundary validation for service protocol payloads.                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for service abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateServiceCreate(input)                   Validate ServiceCreate payloads.
validateServiceUpdate(input)                   Validate ServiceUpdate payloads.
validateServiceRequiredAssetTypeCreate(input)  Validate service asset requirement payloads.
*/

import {
  expectCompositionMany,
  expectConstEnum,
  expectId,
  expectNonEmptyString,
  type ExpectResult,
  expectValid,
  isNonEmptyString
} from '@core/std'
import { SERVICE_CATEGORIES } from '@domain/abstractions/service.ts'
import type {
  ServiceCreate,
  ServiceRequiredAssetTypeCreate,
  ServiceUpdate
} from '@domain/protocols/service-protocol.ts'
import { isNote } from '@domain/validators/common-validator.ts'

/** Validate ServiceCreate payloads. */
export const validateServiceCreate = (input: ServiceCreate): ExpectResult =>
  expectValid(
    expectCompositionMany(input.notes, 'notes', isNote),
    expectNonEmptyString(input.name, 'name'),
    expectNonEmptyString(input.sku, 'sku'),
    expectNonEmptyString(input.description, 'description', true),
    expectConstEnum(input.category, 'category', SERVICE_CATEGORIES),
    expectCompositionMany(input.tagsWorkflowCandidates, 'tagsWorkflowCandidates', isNonEmptyString)
  )

/** Validate ServiceUpdate payloads. */
export const validateServiceUpdate = (input: ServiceUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectCompositionMany(input.notes, 'notes', isNote, true),
    expectNonEmptyString(input.name, 'name', true),
    expectNonEmptyString(input.sku, 'sku', true),
    expectNonEmptyString(input.description, 'description', true),
    expectConstEnum(input.category, 'category', SERVICE_CATEGORIES, true),
    expectCompositionMany(
      input.tagsWorkflowCandidates,
      'tagsWorkflowCandidates',
      isNonEmptyString,
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
