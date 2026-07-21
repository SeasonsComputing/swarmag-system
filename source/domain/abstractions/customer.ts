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
Contact            Account reachability data, not a person identity.
CustomerSite       Serviceable customer location abstraction.
CustomerUser       Junction between customer accounts and users.
CUSTOMER_STATUSES  Allowed customer status values.
CustomerStatus     Customer status derived from CUSTOMER_STATUSES.
Customer           Customer account aggregate abstraction.
*/

import type {
  AssociationJunction,
  AssociationOne,
  AssociationOptional,
  CompositionMany,
  CompositionOne,
  Instantiable
} from '@core/std'
import type { ContactPreferredChannel, Location, Note } from '@domain/abstractions/common.ts'
import type { User } from '@domain/abstractions/user.ts'

/** Account reachability data — how to reach the party behind a record; not a person identity. */
export type Contact = {
  displayName: string
  phoneNumber: string
  preferredChannel: ContactPreferredChannel
  email?: string
}

/** Serviceable customer location abstraction. */
export type CustomerSite = {
  customerId: AssociationOne<Customer>
  location: CompositionOne<Location>
  notes: CompositionMany<Note>
  label: string
  acreage?: number
}

/** Junction between customer accounts and users. */
export type CustomerUser = {
  customerId: AssociationJunction<Customer>
  userId: AssociationJunction<User>
}

/** Allowed customer status values. */
export const CUSTOMER_STATUSES = ['active', 'inactive', 'prospect'] as const
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number]

/** Customer account aggregate abstraction. */
export type Customer = Instantiable & {
  accountManagerId: AssociationOptional<User>
  primaryContact: CompositionOne<Contact>
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
