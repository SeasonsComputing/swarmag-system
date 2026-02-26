/**
 * Protocol input shapes for Customer boundary operations.
 */

import type { Id } from '@core-std'
import type { Location } from '@domain/abstractions/common.ts'
import type { Contact, Customer } from '@domain/abstractions/customer.ts'

/** Input for creating a CustomerSite. */
export type CustomerSiteCreate = {
  customerId: Id
  label: string
  location: Location
  acreage?: number
}

/** Input for updating a CustomerSite. */
export type CustomerSiteUpdate = {
  id: Id
  label?: string
  location?: Location
  acreage?: number
}

/** Input for creating a Customer. */
export type CustomerCreate = {
  name: string
  status: Customer['status']
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
export type CustomerUpdate = {
  id: Id
  name?: string
  status?: Customer['status']
  line1?: string
  line2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  accountManagerId?: Id
}
