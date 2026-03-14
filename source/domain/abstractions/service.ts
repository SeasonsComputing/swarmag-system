/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Service domain abstractions                                                 ║
║ Service catalog abstractions and required asset-type junctions              ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines sellable service abstractions and required asset type relationships.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
SERVICE_CATEGORIES                  Allowed service family classifications.
ServiceCategory                     Service family classification union.
Service                             Sellable operational offering abstraction.
ServiceRequiredAssetType            Junction linking services to asset types.
*/

import type { AssociationJunction, CompositionMany, Instantiable } from '@core/std'
import type { AssetType } from '@domain/abstractions/asset.ts'
import type { Note } from '@domain/abstractions/common.ts'

/** Service family classification values. */
export const SERVICE_CATEGORIES = [
  'aerial-drone-services',
  'ground-machinery-services'
] as const
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

/** Required asset-type relation for a service. */
export type ServiceRequiredAssetType = {
  serviceId: AssociationJunction<Service>
  assetTypeId: AssociationJunction<AssetType>
}
