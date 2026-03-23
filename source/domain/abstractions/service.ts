/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Service domain abstractions                                                  ║
║ Canonical types for services and required asset relations.                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines sellable services and required asset type junction abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
SERVICE_CATEGORIES         Allowed service category values.
ServiceCategory            Service category derived from SERVICE_CATEGORIES.
Service                    Sellable operational offering abstraction.
ServiceRequiredAssetType   Junction for service-to-asset-type requirement.
*/

import type { AssociationJunction, CompositionMany, Instantiable } from '@core/std'
import type { AssetType } from '@domain/abstractions/asset.ts'
import type { Note } from '@domain/abstractions/common.ts'

/** Allowed service category values. */
export const SERVICE_CATEGORIES = [
  'aerial-drone-services',
  'ground-machinery-services'
] as const
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]

/** Sellable operational offering abstraction. */
export type Service = Instantiable & {
  notes: CompositionMany<Note>
  name: string
  sku: string
  description?: string
  category: ServiceCategory
  tagsWorkflowCandidates: CompositionMany<string>
}

/** Junction for service-to-asset-type requirement. */
export type ServiceRequiredAssetType = {
  serviceId: AssociationJunction<Service>
  assetTypeId: AssociationJunction<AssetType>
}
