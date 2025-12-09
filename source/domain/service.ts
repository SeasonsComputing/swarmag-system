/**
 * Domain models for services in the swarmAg system.
 * Services are the types of operations offered to customers.
 */

import type { ID } from '@utils/identifier'
import type { When } from '@utils/datetime'
import type { Note } from './common'

/** The categories of services available. */
export type ServiceCategory = 'aerial-drone-services' | 'ground-machinery-services'

/** The pricing or rate structure for a service. */
export interface ServiceRate {
  unit: 'acre' | 'hour' | 'flat' | 'visit'
  amount: number
  currency: string
  notes?: string
}

/** Information about regulatory aspects of a service. */
export interface ServiceRegulation {
  agency: string
  reference: string
  summary?: string
}

/** Represents a service entity in the swarmAg system. */
export interface Service {
  id: ID
  slug: string
  name: string
  description?: string
  category: ServiceCategory
  isRegulated: boolean
  regulation?: ServiceRegulation
  defaultWorkflowId?: ID
  defaultDurationMinutes?: number
  permittedChemicals: ID[]
  requiredAssets: ID[]
  rates?: ServiceRate[]
  notes?: Note[]
  createdAt: When
  updatedAt: When
}
