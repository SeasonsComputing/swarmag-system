/**
 * Domain models for customers in the swarmAg system.
 * Customers are organizations that purchase services.
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

/** Embedded customer contact; isPrimary flags the primary contact. */
export type Contact = {
  name: string
  email?: string
  phone?: string
  isPrimary: boolean
  preferredChannel?: 'email' | 'text' | 'phone'
  notes: CompositionMany<Note>
}

/** Serviceable customer location. */
export type CustomerSite = {
  customerId: AssociationOne<Customer>
  label: string
  location: CompositionOne<Location>
  acreage?: number
  notes: CompositionMany<Note>
}

/** Customer account aggregate; contacts must be non-empty. */
export type Customer = Instantiable & {
  name: string
  status: 'active' | 'inactive' | 'prospect'
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  accountManagerId: AssociationOptional<User>
  sites: CompositionMany<CustomerSite>
  contacts: CompositionPositive<Contact>
  notes: CompositionMany<Note>
}
