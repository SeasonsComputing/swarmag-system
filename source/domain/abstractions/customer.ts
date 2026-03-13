/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer domain abstractions                                                 ║
║ Customer account, site, and contact types.                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines the Customer aggregate with embedded contacts, sites, and notes.
Includes contact channel and customer status enumerations.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CONTACT_CHANNELS   Canonical contact preferred channel values.
ContactChannel     Contact channel union type.
Contact            Embedded customer contact with channel preference.
CustomerSite       Serviceable customer location.
CUSTOMER_STATUSES  Canonical customer status values.
CustomerStatus     Customer status union type.
Customer           Customer account aggregate.
*/

import type {
  AssociationOne,
  AssociationOptional,
  CompositionMany,
  CompositionOne,
  CompositionPositive,
  Instantiable
} from '@core/std'
import type { Location, Note } from '@domain/abstractions/common.ts'
import type { User } from '@domain/abstractions/user.ts'

/** Canonical contact preferred channel values. */
export const CONTACT_CHANNELS = ['email', 'text', 'phone'] as const
export type ContactChannel = (typeof CONTACT_CHANNELS)[number]

/** Embedded customer contact; isPrimary flags the primary contact. */
export type Contact = {
  notes: CompositionMany<Note>
  name: string
  email?: string
  phone?: string
  isPrimary: boolean
  preferredChannel: ContactChannel
}

/** Serviceable customer location. */
export type CustomerSite = {
  customerId: AssociationOne<Customer>
  location: CompositionOne<Location>
  notes: CompositionMany<Note>
  label: string
  acreage?: number
}

/** Canonical customer status values. */
export const CUSTOMER_STATUSES = ['active', 'inactive', 'prospect'] as const
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number]

/** Customer account aggregate; contacts must be non-empty. */
export type Customer = Instantiable & {
  accountManagerId: AssociationOptional<User>
  sites: CompositionMany<CustomerSite>
  contacts: CompositionPositive<Contact>
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
