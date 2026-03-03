/**
 * Domain models for customers in the swarmAg system.
 */

import type {
  AssociationOne,
  AssociationOptional,
  CompositionMany,
  CompositionOne,
  CompositionPositive,
  Instantiable
} from '@core-std'
import type { Location, Note } from '@domain/abstractions/common.ts'
import type { User } from '@domain/abstractions/user.ts'

/** Contact channel preferences. */
export const CONTACT_PREFERRED_CHANNELS = ['email', 'text', 'phone'] as const
export type ContactPreferredChannel = (typeof CONTACT_PREFERRED_CHANNELS)[number]

/** Embedded customer contact. */
export type Contact = {
  name: string
  email?: string
  phone?: string
  isPrimary: boolean
  preferredChannel?: ContactPreferredChannel
  notes: CompositionMany<Note>
}

/** Serviceable customer location. */
export type CustomerSite = {
  customerId: AssociationOne<Customer>
  location: CompositionOne<Location>
  notes: CompositionMany<Note>
  label: string
  acreage?: number
}

/** Customer lifecycle state. */
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
