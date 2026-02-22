/**
 * Domain models for services offered by swarmAg.
 * Services are sellable operational offerings identified by SKU and category.
 */

import type { Id, When } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'

/** Service family classification. */
export type ServiceCategory =
  | 'aerial-drone-services'
  | 'ground-machinery-services'

/** Sellable operational offering with SKU, category, and asset requirements. */
export type Service = {
  id: Id
  name: string
  sku: string
  description?: string
  category: ServiceCategory
  notes: [Note?, ...Note[]]
  createdAt: When
  updatedAt: When
  deletedAt?: When
}

/** Junction type associating a service with a required asset type. */
export type ServiceRequiredAssetType = {
  serviceId: Id
  assetTypeId: Id
  deletedAt?: When
}
