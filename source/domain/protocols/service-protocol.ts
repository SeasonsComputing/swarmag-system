/**
 * Protocol input shapes for Service create and update operations.
 * Partial shapes for boundary transmission — no domain logic.
 */

import type { Id } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'
import type { ServiceCategory } from '@domain/abstractions/service.ts'

/** Input shape for creating a Service. */
export type ServiceCreateInput = {
  name: string
  sku: string
  description?: string
  category: ServiceCategory
  notes?: [Note?, ...Note[]]
}

/** Input shape for updating a Service. */
export type ServiceUpdateInput = {
  id: Id
  name?: string
  sku?: string
  description?: string
  category?: ServiceCategory
  notes?: [Note?, ...Note[]]
}
