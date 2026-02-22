/**
 * Adapter for converting between Dictionary (storage) and Service domain abstractions.
 * Maps snake_case column names to camelCase domain fields and back.
 */

import type { Dictionary } from '@core-std'
import type {
  Service,
  ServiceCategory,
  ServiceRequiredAssetType
} from '@domain/abstractions/service.ts'

/** Converts a storage dictionary to a Service domain object. */
export const toService = (dict: Dictionary): Service => {
  if (!dict['id']) throw new Error('Service dictionary missing required field: id')
  if (!dict['name']) throw new Error('Service dictionary missing required field: name')
  if (!dict['sku']) throw new Error('Service dictionary missing required field: sku')
  if (!dict['category']) throw new Error('Service dictionary missing required field: category')
  if (!dict['created_at']) {
    throw new Error('Service dictionary missing required field: created_at')
  }
  if (!dict['updated_at']) {
    throw new Error('Service dictionary missing required field: updated_at')
  }

  return {
    id: dict['id'] as string,
    name: dict['name'] as string,
    sku: dict['sku'] as string,
    description: dict['description'] as string | undefined,
    category: dict['category'] as ServiceCategory,
    notes: (dict['notes'] ?? []) as Service['notes'],
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined
  }
}

/** Converts a Service domain object to a storage dictionary. */
export const fromService = (service: Service): Dictionary => ({
  id: service.id,
  name: service.name,
  sku: service.sku,
  description: service.description,
  category: service.category,
  notes: service.notes,
  created_at: service.createdAt,
  updated_at: service.updatedAt,
  deleted_at: service.deletedAt
})

/** Converts a storage dictionary to a ServiceRequiredAssetType domain object. */
export const toServiceRequiredAssetType = (dict: Dictionary): ServiceRequiredAssetType => {
  if (!dict['service_id']) {
    throw new Error('ServiceRequiredAssetType dictionary missing required field: service_id')
  }
  if (!dict['asset_type_id']) {
    throw new Error(
      'ServiceRequiredAssetType dictionary missing required field: asset_type_id'
    )
  }

  return {
    serviceId: dict['service_id'] as string,
    assetTypeId: dict['asset_type_id'] as string,
    deletedAt: dict['deleted_at'] as string | undefined
  }
}

/** Converts a ServiceRequiredAssetType domain object to a storage dictionary. */
export const fromServiceRequiredAssetType = (
  junction: ServiceRequiredAssetType
): Dictionary => ({
  service_id: junction.serviceId,
  asset_type_id: junction.assetTypeId,
  deleted_at: junction.deletedAt
})
