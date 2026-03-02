/**
 * Protocols for the customer domain area: Customer create and update shapes.
 */

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type { Customer } from '@domain/abstractions/customer.ts'

/** Input for creating a Customer. */
export type CustomerCreate = CreateFromInstantiable<Customer>

/** Input for updating a Customer. */
export type CustomerUpdate = UpdateFromInstantiable<Customer>
