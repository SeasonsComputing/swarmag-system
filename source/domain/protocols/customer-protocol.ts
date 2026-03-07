/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer protocol shapes                                                     ║
║ Create and update payloads for customer topic abstractions.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines create and update protocol shapes for the Customer abstraction.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
CustomerCreate  Create payload for a Customer.
CustomerUpdate  Update payload for a Customer.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type { Customer } from '@domain/abstractions/customer.ts'

// ────────────────────────────────────────────────────────────────────────────
// PROTOCOL
// ────────────────────────────────────────────────────────────────────────────

export type CustomerCreate = CreateFromInstantiable<Customer>
export type CustomerUpdate = UpdateFromInstantiable<Customer>
