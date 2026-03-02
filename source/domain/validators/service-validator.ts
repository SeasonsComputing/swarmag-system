/**
 * Validators for the service domain area: Service create and update.
 */

import type { Dictionary } from '@core-std'
import { isCompositionMany, isId, isNonEmptyString, isWhen } from '@core-std'
import type { ServiceCategory } from '@domain/abstractions/service.ts'
import { SERVICE_CATEGORIES } from '@domain/abstractions/service.ts'
import type { ServiceCreate, ServiceUpdate } from '@domain/protocols/service-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates ServiceCreate; returns error message or null. */
export const validateServiceCreate = (input: ServiceCreate): string | null => {
  if (!isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (!isNonEmptyString(input.sku)) return 'sku must be a non-empty string'
  if (!isServiceCategory(input.category)) {
    return 'category must be a valid ServiceCategory'
  }
  if (
    !isCompositionMany(input.tagsWorkflowCandidates,
      (t): t is string => typeof t === 'string')
  ) {
    return 'tagsWorkflowCandidates must be an array of strings'
  }
  if (!isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

/** Validates ServiceUpdate; returns error message or null. */
export const validateServiceUpdate = (input: ServiceUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid UUID'
  if (input.name !== undefined && !isNonEmptyString(input.name)) {
    return 'name must be a non-empty string'
  }
  if (input.sku !== undefined && !isNonEmptyString(input.sku)) {
    return 'sku must be a non-empty string'
  }
  if (input.category !== undefined && !isServiceCategory(input.category)) {
    return 'category must be a valid ServiceCategory'
  }
  if (
    input.tagsWorkflowCandidates !== undefined
    && !isCompositionMany(input.tagsWorkflowCandidates,
      (t): t is string => typeof t === 'string')
  ) {
    return 'tagsWorkflowCandidates must be an array of strings'
  }
  if (input.notes !== undefined && !isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATOR GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isServiceCategory = (v: unknown): v is ServiceCategory =>
  typeof v === 'string' && (SERVICE_CATEGORIES as readonly string[]).includes(v)

const isNote = (v: unknown): v is Dictionary => {
  const d = v as Dictionary
  return isNonEmptyString(d.content) && isWhen(d.createdAt)
    && Array.isArray(d.attachments)
}
