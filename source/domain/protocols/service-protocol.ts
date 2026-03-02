/**
 * Protocols for the service domain area: Service create and update shapes.
 */

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type { Service } from '@domain/abstractions/service.ts'

/** Input for creating a Service. */
export type ServiceCreate = CreateFromInstantiable<Service>

/** Input for updating a Service. */
export type ServiceUpdate = UpdateFromInstantiable<Service>
