/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Service domain abstractions                                                  ║
║ Sellable operational offerings and asset type requirements.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines the Service abstraction, service category enumeration, and the
ServiceRequiredAssetType junction linking services to required asset types.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
SERVICE_CATEGORIES         Canonical service category values.
ServiceCategory            Service category union type.
Service                    Sellable operational offering.
ServiceRequiredAssetType   Junction — asset types required for a service.
*/

import type { AssociationJunction, CompositionMany, Instantiable } from '@core/std'
import type { AssetType } from '@domain/abstractions/asset.ts'
import type { Note } from '@domain/abstractions/common.ts'

/** Canonical service category values. */
export const SERVICE_CATEGORIES = ['aerial-drone-services', 'ground-machinery-services'] as const
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]

/** Sellable operational offering. */
export type Service = Instantiable & {
  notes: CompositionMany<Note>
  name: string
  sku: string
  description?: string
  category: ServiceCategory
  tagsWorkflowCandidates: CompositionMany<string>
}

/** Junction — asset types required for a service; hard delete only. */
export type ServiceRequiredAssetType = {
  serviceId: AssociationJunction<Service>
  assetTypeId: AssociationJunction<AssetType>
}
