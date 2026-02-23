/**
 * Protocol input types for Customer boundary operations.
 */

import type { Id } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'
import type { Contact, CustomerSite } from '@domain/abstractions/customer.ts'

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
  primaryContactId?: Id
  sites?: [CustomerSite?, ...CustomerSite[]]
  contacts?: [Contact, ...Contact[]]
  notes?: [Note?, ...Note[]]
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
  primaryContactId?: Id
  sites?: [CustomerSite?, ...CustomerSite[]]
  contacts?: [Contact, ...Contact[]]
  notes?: [Note?, ...Note[]]
}
