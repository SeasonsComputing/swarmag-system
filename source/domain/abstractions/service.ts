/**
 * Domain models for services in the swarmAg system.
 * A Service is a sellable operational offering identified by SKU and category.
 * ServiceRequiredAssetType expresses the m:m relationship between services
 * and the asset types required to execute them.
 */

import type { AssociationJunction, CompositionMany, Instantiable } from '@core-std'
import type { AssetType } from '@domain/abstractions/asset.ts'
import type { Note } from '@domain/abstractions/common.ts'

/** Service family classification. */
export type ServiceCategory = 'aerial-drone-services' | 'ground-machinery-services'

/** Sellable operational offering. */
export type Service = Instantiable & {
  name: string
  sku: string
  description?: string
  category: ServiceCategory
  tagsWorkflowCandidates: CompositionMany<string>
  notes: CompositionMany<Note>
}

/** m:m junction — services to required asset types; hard delete only. */
export type ServiceRequiredAssetType = {
  serviceId: AssociationJunction<Service>
  assetTypeId: AssociationJunction<AssetType>
}
