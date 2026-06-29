/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer domain abstractions                                                 ║
║ Canonical types for customer accounts, sites, and user contacts.             ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines customer aggregates with site structures and user contact relationships.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CustomerSite                Serviceable customer location abstraction.
CustomerContact             Junction between customer accounts and users.
CUSTOMER_STATUSES           Allowed customer status values.
CustomerStatus              Customer status derived from CUSTOMER_STATUSES.
Customer                    Customer account aggregate abstraction.
*/

import type {
  AssociationJunction,
  AssociationOne,
  AssociationOptional,
  CompositionMany,
  CompositionOne,
  Instantiable
} from '@core/std'
import type { Location, Note } from '@domain/abstractions/common.ts'
import type { User } from '@domain/abstractions/user.ts'

/** Serviceable customer location abstraction. */
export type CustomerSite = {
  customerId: AssociationOne<Customer>
  location: CompositionOne<Location>
  notes: CompositionMany<Note>
  label: string
  acreage?: number
}

/** Junction between customer accounts and users. */
export type CustomerContact = {
  customerId: AssociationJunction<Customer>
  userId: AssociationJunction<User>
}

/** Allowed customer status values. */
export const CUSTOMER_STATUSES = ['active', 'inactive', 'prospect'] as const
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number]

/** Customer account aggregate abstraction. */
export type Customer = Instantiable & {
  accountManagerId: AssociationOptional<User>
  primaryContactId: AssociationOne<User>
  sites: CompositionMany<CustomerSite>
  notes: CompositionMany<Note>
  name: string
  status: CustomerStatus
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}
