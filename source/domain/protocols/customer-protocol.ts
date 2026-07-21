/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer protocol types                                                      ║
║ Boundary payload contracts for customer topic abstractions.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines create and update protocol payload shapes for customer abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CustomerCreate      Create payload for Customer.
CustomerUpdate      Update payload for Customer.
CustomerUserCreate  Create payload for CustomerUser junction.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { Customer, CustomerUser } from '@domain/abstractions/customer.ts'

/* Customer protocol */
export type CustomerCreate = CreateFromInstantiable<Customer>
export type CustomerUpdate = UpdateFromInstantiable<Customer>

/* CustomerUser protocol */
export type CustomerUserCreate = CustomerUser
