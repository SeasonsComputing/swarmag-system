/**
 * Protocol input shapes for Customer create and update operations.
 * Partial shapes for boundary transmission — no domain logic.
 */

import type { Id } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'
import type { Customer } from '@domain/abstractions/customer.ts'

/** Input shape for creating a Customer. */
export type CustomerCreateInput = {
  name: string
  status: Customer['status']
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  accountManagerId?: Id
  primaryContactId?: Id
  notes?: [Note?, ...Note[]]
}

/** Input shape for updating a Customer. */
export type CustomerUpdateInput = {
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
  primaryContactId?: Id
  notes?: [Note?, ...Note[]]
}
