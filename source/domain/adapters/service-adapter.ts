/**
 * Adapters for converting between Dictionary and Service domain abstractions.
 */

import type { Dictionary } from '@core-std'
import { notValid } from '@core-std'
import type { Service, ServiceRequiredAssetType } from '@domain/abstractions/service.ts'

/** Convert a Dictionary to a Service domain object. */
export const toService = (dict: Dictionary): Service => {
  if (!dict['id']) notValid('Service dictionary missing required field: id')
  if (!dict['name']) notValid('Service dictionary missing required field: name')
  if (!dict['sku']) notValid('Service dictionary missing required field: sku')
  if (!dict['category']) notValid('Service dictionary missing required field: category')
  if (!dict['created_at']) notValid('Service dictionary missing required field: created_at')
  if (!dict['updated_at']) notValid('Service dictionary missing required field: updated_at')

  return {
    id: dict['id'] as string,
    name: dict['name'] as string,
    sku: dict['sku'] as string,
    description: dict['description'] as string | undefined,
    category: dict['category'] as Service['category'],
    tagsWorkflowCandidates:
      (dict['tags_workflow_candidates'] ?? []) as Service['tagsWorkflowCandidates'],
    notes: (dict['notes'] ?? []) as Service['notes'],
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined
  }
}

/** Convert a Service domain object to a Dictionary. */
export const fromService = (service: Service): Dictionary => ({
  id: service.id,
  name: service.name,
  sku: service.sku,
  description: service.description,
  category: service.category,
  tags_workflow_candidates: service.tagsWorkflowCandidates,
  notes: service.notes,
  created_at: service.createdAt,
  updated_at: service.updatedAt,
  deleted_at: service.deletedAt
})

/** Convert a Dictionary to a ServiceRequiredAssetType domain object. */
export const toServiceRequiredAssetType = (dict: Dictionary): ServiceRequiredAssetType => {
  if (!dict['service_id']) {
    notValid('ServiceRequiredAssetType dictionary missing required field: service_id')
  }
  if (!dict['asset_type_id']) {
    notValid('ServiceRequiredAssetType dictionary missing required field: asset_type_id')
  }

  return {
    serviceId: dict['service_id'] as string,
    assetTypeId: dict['asset_type_id'] as string,
    deletedAt: dict['deleted_at'] as string | undefined
  }
}

/** Convert a ServiceRequiredAssetType domain object to a Dictionary. */
export const fromServiceRequiredAssetType = (
  junction: ServiceRequiredAssetType
): Dictionary => ({
  service_id: junction.serviceId,
  asset_type_id: junction.assetTypeId,
  deleted_at: junction.deletedAt
})
