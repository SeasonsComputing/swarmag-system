/**
 * Protocol input shapes for Service boundary operations.
 */

import type { Id } from '@core-std'
import type { ServiceCategory } from '@domain/abstractions/service.ts'

/** Input for creating a Service. */
export type ServiceCreate = {
  name: string
  sku: string
  description?: string
  category: ServiceCategory
}

/** Input for updating a Service. */
export type ServiceUpdate = {
  id: Id
  name?: string
  sku?: string
  description?: string
  category?: ServiceCategory
}

/** Input for creating a ServiceRequiredAssetType junction. */
export type ServiceRequiredAssetTypeCreate = {
  serviceId: Id
  assetTypeId: Id
}
