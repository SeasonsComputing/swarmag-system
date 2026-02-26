/**
 * Service protocol validator
 */

import { isId, isNonEmptyString } from '@core-std'
import type {
  ServiceCreateInput,
  ServiceUpdateInput
} from '@domain/protocols/service-protocol.ts'

const SERVICE_CATEGORIES = ['aerial-drone-services', 'ground-machinery-services'] as const

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates ServiceCreateInput; returns error message or null. */
export const validateServiceCreate = (input: ServiceCreateInput): string | null => {
  if (!isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (!isNonEmptyString(input.sku)) return 'sku must be a non-empty string'
  if (!SERVICE_CATEGORIES.includes(input.category)) {
    return `category must be one of: ${SERVICE_CATEGORIES.join(', ')}`
  }
  return null
}

/** Validates ServiceUpdateInput; returns error message or null. */
export const validateServiceUpdate = (input: ServiceUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.name !== undefined && !isNonEmptyString(input.name)) {
    return 'name must be a non-empty string'
  }
  if (input.sku !== undefined && !isNonEmptyString(input.sku)) {
    return 'sku must be a non-empty string'
  }
  if (input.category !== undefined && !SERVICE_CATEGORIES.includes(input.category)) {
    return `category must be one of: ${SERVICE_CATEGORIES.join(', ')}`
  }
  return null
}
