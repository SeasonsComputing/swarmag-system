/**
 * Service domain adapters.
 */

import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'
import type {
  Service,
  ServiceCategory,
  ServiceRequiredAssetType
} from '@domain/abstractions/service.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

/** Create a Service from its dictionary representation. */
export const toService = (dict: Dictionary): Service => {
  if (!dict.id) return notValid('Service dictionary missing required field: id')
  if (!dict.name) return notValid('Service dictionary missing required field: name')
  if (!dict.sku) return notValid('Service dictionary missing required field: sku')
  if (!dict.category) {
    return notValid('Service dictionary missing required field: category')
  }
  if (!dict.tags_workflow_candidates) {
    return notValid('Service dictionary missing required field: tags_workflow_candidates')
  }
  if (!dict.notes) return notValid('Service dictionary missing required field: notes')
  if (!dict.created_at) {
    return notValid('Service dictionary missing required field: created_at')
  }
  if (!dict.updated_at) {
    return notValid('Service dictionary missing required field: updated_at')
  }

  return {
    id: dict.id as string,
    name: dict.name as string,
    sku: dict.sku as string,
    description: dict.description as string | undefined,
    category: dict.category as ServiceCategory,
    tagsWorkflowCandidates: (dict.tags_workflow_candidates as string[]).map(value =>
      value
    ),
    notes: (dict.notes as Note[]).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation from a Service. */
export const fromService = (service: Service): Dictionary => ({
  id: service.id,
  name: service.name,
  sku: service.sku,
  description: service.description,
  category: service.category,
  tags_workflow_candidates: service.tagsWorkflowCandidates.map(value => value),
  notes: service.notes.map(fromNote),
  created_at: service.createdAt,
  updated_at: service.updatedAt,
  deleted_at: service.deletedAt
})

/** Create a ServiceRequiredAssetType from its dictionary representation. */
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

/** Create a dictionary representation from a ServiceRequiredAssetType. */
export const fromServiceRequiredAssetType = (
  requiredType: ServiceRequiredAssetType
): Dictionary => ({
  service_id: requiredType.serviceId,
  asset_type_id: requiredType.assetTypeId
})
