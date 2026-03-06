/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Service protocol validator                                                 ║
║ Boundary validation for service protocol payloads.                         ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for service topic abstractions.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
validateServiceCreate(input)
  Validate ServiceCreate payloads.

validateServiceUpdate(input)
  Validate ServiceUpdate payloads.
*/

import { isCompositionMany, isId, isNonEmptyString } from '@core-std'
import { SERVICE_CATEGORIES, type ServiceCategory } from '@domain/abstractions/service.ts'
import type { ServiceCreate, ServiceUpdate } from '@domain/protocols/service-protocol.ts'
import { isNote } from '@domain/validators/common-validator.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates ServiceCreate; returns error message or null. */
export const validateServiceCreate = (input: ServiceCreate): string | null => {
  if (!isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  if (!isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (!isNonEmptyString(input.sku)) return 'sku must be a non-empty string'
  if (input.description !== undefined && !isNonEmptyString(input.description)) {
    return 'description must be a non-empty string when provided'
  }
  if (!SERVICE_CATEGORIES.includes(input.category as ServiceCategory)) {
    return 'category must be a valid ServiceCategory'
  }
  if (
    !isCompositionMany(
      input.tagsWorkflowCandidates,
      (entry): entry is string => isNonEmptyString(entry)
    )
  ) {
    return 'tagsWorkflowCandidates must be an array of non-empty strings'
  }
  return null
}

/** Validates ServiceUpdate; returns error message or null. */
export const validateServiceUpdate = (input: ServiceUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'

  if (input.notes !== undefined && !isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values when provided'
  }
  if (input.name !== undefined && !isNonEmptyString(input.name)) {
    return 'name must be a non-empty string when provided'
  }
  if (input.sku !== undefined && !isNonEmptyString(input.sku)) {
    return 'sku must be a non-empty string when provided'
  }
  if (input.description !== undefined && !isNonEmptyString(input.description)) {
    return 'description must be a non-empty string when provided'
  }
  if (
    input.category !== undefined
    && !SERVICE_CATEGORIES.includes(input.category as ServiceCategory)
  ) {
    return 'category must be a valid ServiceCategory when provided'
  }
  if (
    input.tagsWorkflowCandidates !== undefined
    && !isCompositionMany(
      input.tagsWorkflowCandidates,
      (entry): entry is string => isNonEmptyString(entry)
    )
  ) {
    return 'tagsWorkflowCandidates must be an array of non-empty strings when provided'
  }
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ────────────────────────────────────────────────────────────────────────────
