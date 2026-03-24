/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Service domain adapters                                                      ║
║ Dictionary serialization for service topic abstractions.                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Maps storage dictionaries to service abstractions and back.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toService(dict)                       Deserialize Service from dictionary.
fromService(service)                  Serialize Service to dictionary.
toServiceRequiredAssetType(dict)      Deserialize service requirement junction.
fromServiceRequiredAssetType(record)  Serialize service requirement junction.
*/

import type { Dictionary } from '@core/std'
import type { Service, ServiceRequiredAssetType } from '@domain/abstractions/service.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

/** Deserialize Service from dictionary. */
export const toService = (dict: Dictionary): Service => ({
  id: dict.id as string,
  createdAt: dict.created_at as string,
  updatedAt: dict.updated_at as string,
  deletedAt: dict.deleted_at as string | undefined,
  notes: (dict.notes as Dictionary[] | undefined ?? []).map(toNote),
  name: dict.name as string,
  sku: dict.sku as string,
  description: dict.description as string | undefined,
  category: dict.category as Service['category'],
  tagsWorkflowCandidates: (dict.tags_workflow_candidates as string[] | undefined) ?? []
})

/** Serialize Service to dictionary. */
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

/** Deserialize ServiceRequiredAssetType from dictionary. */
export const toServiceRequiredAssetType = (dict: Dictionary): ServiceRequiredAssetType => ({
  serviceId: dict.service_id as string,
  assetTypeId: dict.asset_type_id as string
})

/** Serialize ServiceRequiredAssetType to dictionary. */
export const fromServiceRequiredAssetType = (record: ServiceRequiredAssetType): Dictionary => ({
  service_id: record.serviceId,
  asset_type_id: record.assetTypeId
})
