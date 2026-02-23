/**
 * Domain abstractions for customers in the swarmAg system.
 * Customers are organizations that purchase services.
 */

import type { Id, When } from '@core-std'
import type { Location, Note } from '@domain/abstractions/common.ts'

/** Customer-associated contact person. */
export type Contact = {
  id: Id
  customerId: Id
  name: string
  email?: string
  phone?: string
  preferredChannel?: 'email' | 'text' | 'phone'
  notes: [Note?, ...Note[]]
  createdAt: When
  updatedAt: When
}

/** Serviceable customer location. */
export type CustomerSite = {
  id: Id
  customerId: Id
  label: string
  location: Location
  acreage?: number
  notes: [Note?, ...Note[]]
}

/** Customer account aggregate; contacts must be non-empty. */
export type Customer = {
  id: Id
  name: string
  status: 'active' | 'inactive' | 'prospect'
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  accountManagerId?: Id
  primaryContactId?: Id
  sites: [CustomerSite?, ...CustomerSite[]]
  contacts: [Contact, ...Contact[]]
  notes: [Note?, ...Note[]]
  createdAt: When
  updatedAt: When
  deletedAt?: When
}
