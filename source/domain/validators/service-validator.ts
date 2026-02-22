/**
 * Validators for service protocol inputs at system boundaries.
 * Returns an error message string on failure, null on success.
 */

import { isNonEmptyString, isId } from '@core-std'
import type { ServiceCreateInput, ServiceUpdateInput } from '@domain/protocols/service-protocol.ts'

/** Validates input for creating a Service. */
export const validateServiceCreate = (input: ServiceCreateInput): string | null => {
  if (!isNonEmptyString(input.name)) return 'name is required'
  if (!isNonEmptyString(input.sku)) return 'sku is required'
  if (!isNonEmptyString(input.category)) return 'category is required'
  return null
}

/** Validates input for updating a Service. */
export const validateServiceUpdate = (input: ServiceUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.name !== undefined && !isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (input.sku !== undefined && !isNonEmptyString(input.sku)) return 'sku must be a non-empty string'
  if (input.category !== undefined && !isNonEmptyString(input.category)) return 'category must be a non-empty string'
  return null
}
