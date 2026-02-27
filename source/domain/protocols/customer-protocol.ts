/**
 * Protocol input shapes for Customer boundary operations.
 */

import type {
  CreateFromInstantiable,
  UpdateFromInstantiable
} from '@core-std'
import type { Customer } from '@domain/abstractions/customer.ts'

/** Input for creating a Customer. */
export type CustomerCreate = CreateFromInstantiable<Customer>

/** Input for updating a Customer. */
export type CustomerUpdate = UpdateFromInstantiable<Customer>
