/**
 * Domain models for services in the swarmAg system.
 * Services are the types of operations offered to customers.
 */

import type { Note } from '@domain/abstractions/common.ts'
import type { ID, When } from '@utils'

/** The categories of services available. */
export type ServiceCategory = 'aerial-drone-services' | 'ground-machinery-services'

/** Represents a service in the swarmAg system. */
export interface Service {
  id: ID
  name: string
  sku: string
  description?: string
  category: ServiceCategory
  requiredAssetTypes: ID[]
  notes?: Note[]
  createdAt: When
  updatedAt: When
}
