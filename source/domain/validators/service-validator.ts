/**
 * Service protocol validators.
 */

import { isId, isNonEmptyString } from '@core-std'
import { SERVICE_CATEGORIES } from '@domain/abstractions/service.ts'
import type { ServiceCategory } from '@domain/abstractions/service.ts'
import type {
  ServiceCreate,
  ServiceRequiredAssetTypeCreate,
  ServiceUpdate
} from '@domain/protocols/service-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates ServiceCreate; returns error message or null. */
export const validateServiceCreate = (input: ServiceCreate): string | null => {
  if (!isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (!isNonEmptyString(input.sku)) return 'sku must be a non-empty string'
  if (!SERVICE_CATEGORIES.includes(input.category as ServiceCategory)) {
    return 'category must be a valid ServiceCategory'
  }
  return null
}

/** Validates ServiceUpdate; returns error message or null. */
export const validateServiceUpdate = (input: ServiceUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.name !== undefined && !isNonEmptyString(input.name)) {
    return 'name must be a non-empty string'
  }
  if (input.sku !== undefined && !isNonEmptyString(input.sku)) {
    return 'sku must be a non-empty string'
  }
  if (
    input.category !== undefined
    && !SERVICE_CATEGORIES.includes(input.category as ServiceCategory)
  ) return 'category must be a valid ServiceCategory'
  return null
}

/** Validates ServiceRequiredAssetTypeCreate; returns error message or null. */
export const validateServiceRequiredAssetTypeCreate = (
  input: ServiceRequiredAssetTypeCreate
): string | null => {
  if (!isId(input.serviceId)) return 'serviceId must be a valid Id'
  if (!isId(input.assetTypeId)) return 'assetTypeId must be a valid Id'
  return null
}
