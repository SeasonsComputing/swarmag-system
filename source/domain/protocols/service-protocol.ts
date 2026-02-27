/**
 * Protocol input shapes for Service boundary operations.
 */

import type {
  CreateFromInstantiable,
  UpdateFromInstantiable
} from '@core-std'
import type {
  Service,
  ServiceRequiredAssetType
} from '@domain/abstractions/service.ts'

/** Input for creating a Service. */
export type ServiceCreate = CreateFromInstantiable<Service>

/** Input for updating a Service. */
export type ServiceUpdate = UpdateFromInstantiable<Service>

/** Input for creating a ServiceRequiredAssetType junction. */
export type ServiceRequiredAssetTypeCreate = Pick<
  ServiceRequiredAssetType,
  'serviceId' | 'assetTypeId'
>
