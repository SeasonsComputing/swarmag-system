/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Customer protocol contracts                                                 ║
║ Create and update payload contracts for customer abstractions               ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines boundary payload contracts for customer persisted abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CustomerCreate                     Create payload contract for Customer.
CustomerUpdate                     Update payload contract for Customer.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { Customer } from '@domain/abstractions/customer.ts'

/** Create payload contract for Customer. */
export type CustomerCreate = CreateFromInstantiable<Customer>

/** Update payload contract for Customer. */
export type CustomerUpdate = UpdateFromInstantiable<Customer>
