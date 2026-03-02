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

/** Preferred contact channel for customer communication. */
export const CONTACT_CHANNELS = ['email', 'text', 'phone'] as const

/** Preferred contact channel value. */
export type ContactChannel = (typeof CONTACT_CHANNELS)[number]

/** Embedded customer contact with primary designation. */
export type Contact = {
  name: string
  email?: string
  phone?: string
  isPrimary: boolean
  preferredChannel?: ContactChannel
  notes: CompositionMany<Note>
}

/** Serviceable customer location. */
export type CustomerSite = {
  customerId: AssociationOne<Customer>
  location: CompositionOne<Location>
  label: string
  acreage?: number
  notes: CompositionMany<Note>
}

/** Customer account lifecycle state. */
export const CUSTOMER_STATUSES = ['active', 'inactive', 'prospect'] as const

/** Customer account lifecycle state value. */
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number]

/** Customer account aggregate with at least one contact. */
export type Customer = Instantiable & {
  name: string
  status: CustomerStatus
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  accountManagerId?: AssociationOptional<User>
  sites: CompositionMany<CustomerSite>
  contacts: CompositionPositive<Contact>
  notes: CompositionMany<Note>
}
