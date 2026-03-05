/**
 * Service domain abstractions.
 */

import type { AssociationJunction, CompositionMany, Instantiable } from '@core-std'
import type { AssetType } from '@domain/abstractions/asset.ts'
import type { Note } from '@domain/abstractions/common.ts'

/** Service family classification. */
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

/** Junction mapping services to required asset types. */
export type ServiceRequiredAssetType = {
  serviceId: AssociationJunction<Service>
  assetTypeId: AssociationJunction<AssetType>
}
