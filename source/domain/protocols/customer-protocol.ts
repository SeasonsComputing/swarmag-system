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
CustomerCreate  Create payload for Customer.
CustomerUpdate  Update payload for Customer.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { Customer } from '@domain/abstractions/customer.ts'

/* Customer protocol */
export type CustomerCreate = CreateFromInstantiable<Customer>
export type CustomerUpdate = UpdateFromInstantiable<Customer>
