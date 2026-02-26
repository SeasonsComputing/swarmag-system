/**
 * Service et al adapters to and from Dictionary representation.
 */

import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type { Service, ServiceCategory, ServiceRequiredAssetType } from '@domain/abstractions/service.ts'
import { toNote, fromNote } from '@domain/adapters/common-adapter.ts'

/** Create a Service from serialized dictionary format */
export const toService = (dict: Dictionary): Service => {
  if (!dict.id) return notValid('Service dictionary missing required field: id')
  if (!dict.name) return notValid('Service dictionary missing required field: name')
  if (!dict.sku) return notValid('Service dictionary missing required field: sku')
  if (!dict.category) return notValid('Service dictionary missing required field: category')
  return {
    id: dict.id as string,
    name: dict.name as string,
    sku: dict.sku as string,
    description: dict.description as string | undefined,
    category: dict.category as ServiceCategory,
    tagsWorkflowCandidates: (dict.tags_workflow_candidates as string[]).map((v) => v),
    notes: (dict.notes as Dictionary[]).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Serialize a Service to dictionary format */
export const fromService = (service: Service): Dictionary => ({
  id: service.id,
  name: service.name,
  sku: service.sku,
  description: service.description,
  category: service.category,
  tags_workflow_candidates: service.tagsWorkflowCandidates.map((v) => v),
  notes: service.notes.map(fromNote),
  created_at: service.createdAt,
  updated_at: service.updatedAt,
  deleted_at: service.deletedAt
})

/** Create a ServiceRequiredAssetType from serialized dictionary format */
export const toServiceRequiredAssetType = (dict: Dictionary): ServiceRequiredAssetType => ({
  serviceId: dict.service_id as string,
  assetTypeId: dict.asset_type_id as string
})

/** Serialize a ServiceRequiredAssetType to dictionary format */
export const fromServiceRequiredAssetType = (junction: ServiceRequiredAssetType): Dictionary => ({
  service_id: junction.serviceId,
  asset_type_id: junction.assetTypeId
})
