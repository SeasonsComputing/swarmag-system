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

import { InstantiableAdapt, makeAdapter } from '@core/stdx'
import type { Service, ServiceRequiredAssetType } from '@domain/abstractions/service.ts'
import { NoteAdapter } from '@domain/adapters/common-adapter.ts'

/** Deserialize/Serialize Service. */
export const ServiceAdapter = makeAdapter<Service>({
  ...InstantiableAdapt,
  notes: ['notes', NoteAdapter],
  name: ['name'],
  sku: ['sku'],
  description: ['description'],
  category: ['category'],
  facets: ['facets']
})

/** Deserialize/Serialize ServiceRequiredAssetType. */
export const ServiceRequiredAssetTypeAdapter = makeAdapter<ServiceRequiredAssetType>({
  serviceId: ['service_id'],
  assetTypeId: ['asset_type_id']
})
