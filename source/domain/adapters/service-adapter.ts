/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Service domain adapters                                                     ║
║ Dictionary serialization for service topic abstractions                     ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Serializes service topic abstractions between Dictionary and domain shapes.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toService                           Deserialize Service from Dictionary.
fromService                         Serialize Service to Dictionary.
toServiceRequiredAssetType          Deserialize ServiceRequiredAssetType from Dictionary.
fromServiceRequiredAssetType        Serialize ServiceRequiredAssetType to Dictionary.
*/

import type { Dictionary, Id, When } from '@core/std'
import type { Service, ServiceRequiredAssetType } from '@domain/abstractions/service.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

/** Deserialize Service from Dictionary. */
export const toService = (dict: Dictionary): Service => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  notes: (dict.notes as Dictionary[]).map(toNote),
  name: dict.name as string,
  sku: dict.sku as string,
  description: dict.description as string | undefined,
  category: dict.category as Service['category'],
  tagsWorkflowCandidates: dict.tags_workflow_candidates as string[]
})

/** Serialize Service to Dictionary. */
export const fromService = (service: Service): Dictionary => ({
  id: service.id,
  created_at: service.createdAt,
  updated_at: service.updatedAt,
  deleted_at: service.deletedAt,
  notes: service.notes.map(fromNote),
  name: service.name,
  sku: service.sku,
  description: service.description,
  category: service.category,
  tags_workflow_candidates: service.tagsWorkflowCandidates
})

/** Deserialize ServiceRequiredAssetType from Dictionary. */
export const toServiceRequiredAssetType = (dict: Dictionary): ServiceRequiredAssetType => ({
  serviceId: dict.service_id as Id,
  assetTypeId: dict.asset_type_id as Id
})

/** Serialize ServiceRequiredAssetType to Dictionary. */
export const fromServiceRequiredAssetType = (
  serviceRequiredAssetType: ServiceRequiredAssetType
): Dictionary => ({
  service_id: serviceRequiredAssetType.serviceId,
  asset_type_id: serviceRequiredAssetType.assetTypeId
})
