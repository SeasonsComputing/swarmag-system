/**
 * Domain abstractions for services in the swarmAg system.
 * Services are sellable operational offerings identified by SKU.
 */

import type { Id, When } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'

/** Service family classification. */
export type ServiceCategory =
  | 'aerial-drone-services'
  | 'ground-machinery-services'

/** Sellable operational offering. */
export type Service = {
  id: Id
  name: string
  sku: string
  description?: string
  category: ServiceCategory
  tagsWorkflowCandidates: [string?, ...string[]]
  notes: [Note?, ...Note[]]
  createdAt: When
  updatedAt: When
  deletedAt?: When
}

/** Junction — services to required asset types. */
export type ServiceRequiredAssetType = {
  serviceId: Id
  assetTypeId: Id
  deletedAt?: When
}
