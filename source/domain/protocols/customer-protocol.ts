/**
 * Protocol input shapes for Customer boundary operations.
 */

import type { Id } from '@core-std'
import type { Location } from '@domain/abstractions/common.ts'
import type { Contact } from '@domain/abstractions/customer.ts'

/** Input for creating a Customer. */
export type CustomerCreateInput = {
  name: string
  status: 'active' | 'inactive' | 'prospect'
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  accountManagerId?: Id
  contacts: Contact[]
}

/** Input for updating a Customer. */
export type CustomerUpdateInput = {
  id: Id
  name?: string
  status?: 'active' | 'inactive' | 'prospect'
  line1?: string
  line2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  accountManagerId?: Id
}

/** Input for creating a CustomerSite. */
export type CustomerSiteCreateInput = {
  customerId: Id
  label: string
  location: Location
  acreage?: number
}

/** Input for updating a CustomerSite. */
export type CustomerSiteUpdateInput = {
  id: Id
  label?: string
  location?: Location
  acreage?: number
}
