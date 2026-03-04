/**
 * Customer domain protocols.
 */

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type { Customer } from '@domain/abstractions/customer.ts'

export type CustomerCreate = CreateFromInstantiable<Customer>
export type CustomerUpdate = UpdateFromInstantiable<Customer>
