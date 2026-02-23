/**
 * Validators for Service boundary inputs.
 */

import { isNonEmptyString } from '@core-std'
import type {
  ServiceCreateInput,
  ServiceUpdateInput
} from '@domain/protocols/service-protocol.ts'

/** Validate input for creating a Service; returns an error message or null. */
export const validateServiceCreate = (input: ServiceCreateInput): string | null => {
  if (!isNonEmptyString(input.name)) return 'name is required'
  if (!isNonEmptyString(input.sku)) return 'sku is required'
  if (!isNonEmptyString(input.category)) return 'category is required'
  return null
}

/** Validate input for updating a Service; returns an error message or null. */
export const validateServiceUpdate = (input: ServiceUpdateInput): string | null => {
  if (!isNonEmptyString(input.id)) return 'id is required'
  if (input.name !== undefined && !isNonEmptyString(input.name)) {
    return 'name must be a non-empty string'
  }
  if (input.sku !== undefined && !isNonEmptyString(input.sku)) {
    return 'sku must be a non-empty string'
  }
  if (input.category !== undefined && !isNonEmptyString(input.category)) {
    return 'category must be a non-empty string'
  }
  return null
}
