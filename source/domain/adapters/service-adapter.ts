/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Service domain adapter                                                       ║
║ Serialization for service topic abstractions.                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Serializes between Dictionary and Service domain types. ServiceRequiredAssetType
is a junction with no independent persistence; adapted inline where needed.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toService                       Deserialize Service from a storage dictionary.
fromService                     Serialize Service to a storage dictionary.
toServiceRequiredAssetType      Deserialize ServiceRequiredAssetType from a dictionary.
fromServiceRequiredAssetType    Serialize ServiceRequiredAssetType to a dictionary.
*/

import type { AssociationJunction, CompositionMany, Dictionary, Id, When } from '@core/std'
import type { AssetType } from '@domain/abstractions/asset.ts'
import type { Note } from '@domain/abstractions/common.ts'
import type {
  Service,
  ServiceCategory,
  ServiceRequiredAssetType
} from '@domain/abstractions/service.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

/** Deserialize Service from a storage dictionary. */
export const toService = (dict: Dictionary): Service => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  notes: (dict.notes as Dictionary[]).map(toNote) as CompositionMany<Note>,
  name: dict.name as string,
  sku: dict.sku as string,
  description: dict.description as string | undefined,
  category: dict.category as ServiceCategory,
  tagsWorkflowCandidates: dict.tags_workflow_candidates as CompositionMany<string>
})

/** Serialize Service to a storage dictionary. */
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

/** Deserialize ServiceRequiredAssetType junction from a storage dictionary. */
export const toServiceRequiredAssetType = (dict: Dictionary): ServiceRequiredAssetType => ({
  serviceId: dict.service_id as AssociationJunction<Service>,
  assetTypeId: dict.asset_type_id as AssociationJunction<AssetType>
})

/** Serialize ServiceRequiredAssetType junction to a storage dictionary. */
export const fromServiceRequiredAssetType = (
  junction: ServiceRequiredAssetType
): Dictionary => ({
  service_id: junction.serviceId,
  asset_type_id: junction.assetTypeId
})
