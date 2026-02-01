/**
 * Protocol types for customer API requests and responses.
 */

import type { Contact, Customer } from '@domain/abstractions/customer.ts'

/** Input type for primary contact in customer creation. */
export interface PrimaryContactInput {
  name: string
  email?: string
  phone?: string
  preferredChannel?: Contact['preferredChannel']
}

/** Input type for creating a customer. */
export interface CustomerCreateInput {
  name: string
  status?: Customer['status']
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  accountManagerId?: string
  primaryContact: PrimaryContactInput
}

/** Input type for updating a customer. */
export interface CustomerUpdateInput {
  id: string
  name?: string
  status?: Customer['status']
  line1?: string
  line2?: string | null
  city?: string
  state?: string
  postalCode?: string
  country?: string
  accountManagerId?: string | null
  primaryContactId?: string
}
