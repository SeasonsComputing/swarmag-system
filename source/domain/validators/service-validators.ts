/**
 * Domain-level invariant validators for services.
 */

import type { Service } from '@domain/abstractions/service.ts'
import { isNonEmptyString } from '@domain/validators/common-validators.ts'

/**
 * Type guard for supported service categories.
 * @param value - Potential category value.
 * @returns True when the value matches a known category.
 */
export const isServiceCategory = (value: unknown): value is Service['category'] =>
  value === 'aerial-drone-services' || value === 'ground-machinery-services'

/**
 * Type guard for an array of ID strings.
 * @param value - Potential ID array value.
 * @returns True when the value is an array of non-empty strings.
 */
export const isIdArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string' && item.length > 0)

/** Input type for creating a service. */
export interface ServiceCreateInput {
  name: string
  sku: string
  description?: string
  category: Service['category']
  requiredAssetTypes: string[]
}

/** Input type for updating a service. */
export interface ServiceUpdateInput {
  id: string
  name?: string
  sku?: string
  description?: string | null
  category?: Service['category']
  requiredAssetTypes?: string[]
}

/**
 * Validate service creation input.
 * @param input - Service creation input to validate.
 * @returns Error message or null if valid.
 */
export const validateServiceCreate = (input?: ServiceCreateInput | null): string | null => {
  if (!input) return 'Request body is required'
  if (!isNonEmptyString(input.name)) return 'name is required'
  if (!isNonEmptyString(input.sku)) return 'sku is required'
  if (!isServiceCategory(input.category)) return 'category must be aerial-drone-services or ground-machinery-services'
  if (!isIdArray(input.requiredAssetTypes)) return 'requiredAssetTypes must be an array of IDs'
  return null
}

/**
 * Validate service update input.
 * @param input - Service update input to validate.
 * @returns Error message or null if valid.
 */
export const validateServiceUpdate = (input?: ServiceUpdateInput | null): string | null => {
  if (!input) return 'Request body is required'
  if (!isNonEmptyString(input.id)) return 'id is required'
  if (input.name !== undefined && !isNonEmptyString(input.name)) return 'name cannot be empty'
  if (input.sku !== undefined && !isNonEmptyString(input.sku)) return 'sku cannot be empty'
  if (input.category !== undefined && !isServiceCategory(input.category)) {
    return 'category must be aerial-drone-services or ground-machinery-services'
  }
  if (input.requiredAssetTypes !== undefined && !isIdArray(input.requiredAssetTypes)) {
    return 'requiredAssetTypes must be an array of IDs'
  }
  return null
}
