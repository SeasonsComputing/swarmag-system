/**
 * Mappers for converting between Supabase customer rows and domain Customers.
 */

import type { Customer } from '@domain/abstractions/customer.ts'
import type { Dictionary } from '@utils'

/**
 * Type guard for customer status.
 * @param value - Potential status value.
 * @returns True when the value matches a known status.
 */
export const isCustomerStatus = (value: unknown): value is Customer['status'] =>
  value === 'active' || value === 'inactive' || value === 'prospect'

/** Map a domain Customer into a Supabase row shape. */
export const customerToRow = (customer: Customer) => ({ id: customer.id, name: customer.name, status: customer.status,
  line1: customer.line1, line2: customer.line2 ?? null, city: customer.city, state: customer.state,
  postal_code: customer.postalCode, country: customer.country, account_manager_id: customer.accountManagerId ?? null,
  primary_contact_id: customer.primaryContactId ?? null, sites: customer.sites, contacts: customer.contacts,
  notes: customer.notes ?? null, created_at: customer.createdAt, updated_at: customer.updatedAt, payload: customer })

/**
 * Convert a Supabase row into a Customer domain model.
 * Payload is truth - if present, use it directly.
 * Falls back to column mapping for legacy records.
 * @param row - The database row to convert.
 * @returns The mapped Customer object.
 * @throws Error if required fields are missing.
 */
export const rowToCustomer = (row: unknown): Customer => {
  if (!row || typeof row !== 'object') {
    throw new Error('Customer row is missing required fields')
  }

  const record = row as Dictionary

  // Payload as truth - direct cast if present
  if (record.payload && typeof record.payload === 'object') {
    const payload = record.payload as Dictionary
    if (
      typeof payload.id === 'string'
      && typeof payload.name === 'string'
      && isCustomerStatus(payload.status)
      && typeof payload.line1 === 'string'
      && typeof payload.city === 'string'
      && Array.isArray(payload.sites)
      && Array.isArray(payload.contacts)
      && payload.contacts.length > 0
    ) {
      return payload as unknown as Customer
    }
  }

  // Legacy fallback - map from columns
  const id = record.id as string
  const name = record.name as string
  const status = record.status
  const line1 = record.line1 as string
  const city = record.city as string
  const state = record.state as string
  const postalCode = (record.postal_code ?? record.postalCode) as string
  const country = record.country as string
  const sites = record.sites
  const contacts = record.contacts

  if (
    !id
    || !name
    || !isCustomerStatus(status)
    || !line1
    || !city
    || !state
    || !postalCode
    || !country
    || !Array.isArray(sites)
    || !Array.isArray(contacts)
    || contacts.length === 0
  ) {
    throw new Error('Customer row is missing required fields')
  }

  return { id, name, status, line1, line2: (record.line2 ?? undefined) as string | undefined, city, state, postalCode,
    country,
    accountManagerId: (record.account_manager_id ?? record.accountManagerId ?? undefined) as string | undefined,
    primaryContactId: (record.primary_contact_id ?? record.primaryContactId ?? undefined) as string | undefined, sites,
    contacts: contacts as Customer['contacts'], notes: Array.isArray(record.notes) ? record.notes : undefined,
    createdAt: (record.created_at ?? record.createdAt) as string,
    updatedAt: (record.updated_at ?? record.updatedAt) as string }
}
