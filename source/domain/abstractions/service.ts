/**
 * Domain models for services in the swarmAg system.
 * Services are the types of operations offered to customers.
 */

import type { Note } from '@domain/abstractions/common.ts'
import type { ID, When } from '@core-std'

/** The categories of services available. */
export type ServiceCategory =
  | 'aerial-drone-services'
  | 'ground-machinery-services'

/** Represents a service in the swarmAg system. */
export interface Service {
  id: ID
  name: string
  sku: string
  description?: string
  category: ServiceCategory
  notes?: Note[]
  createdAt: When
  updatedAt: When
  deletedAt?: When
}

/** Represents the required asset type for a service. */
export interface ServiceRequiredAssetType {
  serviceId: ID
  assetTypeId: ID
  deletedAt?: When
}
