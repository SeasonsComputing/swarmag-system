/**
 * Domain models for customers in the swarmAg system.
 * Customers represent clients who have operations and sites to be serviced.
 */

import type { When } from '@utils/datetime.ts'
import type { ID } from '@utils/identifier.ts'
import type { Address, Author, Location, Note } from '@domain/common.ts'

/** Represents a contact person associated with a customer. */
export interface Contact {
  id: ID
  customerId: ID
  name: string
  email?: string
  phone?: string
  preferredChannel?: 'email' | 'sms' | 'phone'
  notes?: Note[]
  createdAt: When
  updatedAt: When
}

/** Represents a site or location associated with a customer. */
export interface CustomerSite {
  id: ID
  customerId: ID
  label: string
  location: Location
  acreage?: number
  notes?: Note[]
}

/** Represents a customer in the swarmAg system. */
export interface Customer {
  id: ID
  name: string
  status: 'active' | 'inactive' | 'prospect'
  address: Address
  accountManager?: Author
  primaryContactId?: ID
  sites: CustomerSite[]
  contacts: [Contact, ...Contact[]]
  notes?: Note[]
  createdAt: When
  updatedAt: When
}
