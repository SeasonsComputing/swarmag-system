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
ServiceAdapter                   Deserialize/Serialize Service.
ServiceRequiredAssetTypeAdapter  Deserialize/Serialize ServiceRequiredAssetType.
*/

import { makeAdapter } from '@core/stdx'
import type { Service, ServiceRequiredAssetType } from '@domain/abstractions/service.ts'
import { NoteAdapter } from '@domain/adapters/common-adapter.ts'

/** Deserialize/Serialize Service. */
export const ServiceAdapter = makeAdapter<Service>({
  id: ['id'],
  createdAt: ['created_at'],
  updatedAt: ['updated_at'],
  deletedAt: ['deleted_at'],
  notes: ['notes', NoteAdapter],
  name: ['name'],
  sku: ['sku'],
  description: ['description'],
  category: ['category'],
  tagsWorkflowCandidates: ['tags_workflow_candidates']
})

/** Deserialize/Serialize ServiceRequiredAssetType. */
export const ServiceRequiredAssetTypeAdapter = makeAdapter<ServiceRequiredAssetType>({
  serviceId: ['service_id'],
  assetTypeId: ['asset_type_id']
})
