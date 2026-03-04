/**
 * Service domain protocols.
 */

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type { Service } from '@domain/abstractions/service.ts'

export type ServiceCreate = CreateFromInstantiable<Service>
export type ServiceUpdate = UpdateFromInstantiable<Service>
