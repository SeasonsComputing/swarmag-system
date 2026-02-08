/**
 * Protocol types for service API requests and responses.
 */

import type { Service } from '@domain/abstractions/service.ts'

/** Input type for creating a service. */
export interface ServiceCreateInput {
  name: string
  sku: string
  description?: string
  category: Service['category']
}

/** Input type for updating a service. */
export interface ServiceUpdateInput {
  id: string
  name?: string
  sku?: string
  description?: string | null
  category?: Service['category']
}
