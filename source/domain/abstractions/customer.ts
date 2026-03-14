/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Customer domain abstractions                                                ║
║ Customer account abstractions with embedded contacts and sites              ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines customer account abstractions and embedded contact/site objects.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CONTACT_PREFERRED_CHANNELS          Allowed contact communication channels.
ContactPreferredChannel             Contact communication channel union.
Contact                             Embedded customer contact abstraction.
CustomerSite                        Serviceable customer site abstraction.
CUSTOMER_STATUSES                   Allowed customer lifecycle states.
CustomerStatus                      Customer lifecycle state union.
Customer                            Customer account aggregate abstraction.
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

/** Allowed contact communication channels. */
export const CONTACT_PREFERRED_CHANNELS = ['email', 'text', 'phone'] as const
export type ContactPreferredChannel = (typeof CONTACT_PREFERRED_CHANNELS)[number]

/** Embedded customer contact. */
export type Contact = {
  notes: CompositionMany<Note>
  name: string
  email?: string
  phone?: string
  isPrimary: boolean
  preferredChannel: ContactPreferredChannel
}

/** Serviceable customer location. */
export type CustomerSite = {
  customerId: AssociationOne<Customer>
  location: CompositionOne<Location>
  notes: CompositionMany<Note>
  label: string
  acreage?: number
}

/** Allowed customer lifecycle states. */
export const CUSTOMER_STATUSES = ['active', 'inactive', 'prospect'] as const
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number]

/** Customer account aggregate. */
export type Customer = Instantiable & {
  accountManagerId?: AssociationOptional<User>
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
