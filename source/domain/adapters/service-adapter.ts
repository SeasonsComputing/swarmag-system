/**
 * Adapters for the service domain area: Service and ServiceRequiredAssetType.
 */

import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type {
  Service,
  ServiceCategory,
  ServiceRequiredAssetType
} from '@domain/abstractions/service.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

/** Create a Service instance from dictionary representation. */
export const toService = (dict: Dictionary): Service => {
  if (!dict.id) return notValid('Service dictionary missing required field: id')
  if (!dict.name) return notValid('Service dictionary missing required field: name')
  if (!dict.sku) return notValid('Service dictionary missing required field: sku')
  return {
    id: dict.id as string,
    name: dict.name as string,
    sku: dict.sku as string,
    description: dict.description as string | undefined,
    category: dict.category as ServiceCategory,
    tagsWorkflowCandidates: dict.tags_workflow_candidates as string[],
    notes: (dict.notes as Dictionary[]).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation of a Service instance. */
export const fromService = (service: Service): Dictionary => ({
  id: service.id,
  name: service.name,
  sku: service.sku,
  description: service.description,
  category: service.category,
  tags_workflow_candidates: service.tagsWorkflowCandidates,
  notes: service.notes.map(fromNote),
  created_at: service.createdAt,
  updated_at: service.updatedAt,
  deleted_at: service.deletedAt
})

/** Create a ServiceRequiredAssetType instance from dictionary representation. */
export const toServiceRequiredAssetType = (
  dict: Dictionary
): ServiceRequiredAssetType => {
  if (!dict.service_id) {
    return notValid(
      'ServiceRequiredAssetType dictionary missing required field: service_id'
    )
  }
  if (!dict.asset_type_id) {
    return notValid(
      'ServiceRequiredAssetType dictionary missing required field: asset_type_id'
    )
  }
  return {
    serviceId: dict.service_id as string,
    assetTypeId: dict.asset_type_id as string
  }
}

/** Create a dictionary representation of a ServiceRequiredAssetType instance. */
export const fromServiceRequiredAssetType = (
  junction: ServiceRequiredAssetType
): Dictionary => ({
  service_id: junction.serviceId,
  asset_type_id: junction.assetTypeId
})
