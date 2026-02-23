/**
 * Adapters for converting between Dictionary and Customer domain abstractions.
 */

import type { Dictionary } from '@core-std'
import { notValid } from '@core-std'
import type { Customer } from '@domain/abstractions/customer.ts'

/** Convert a Dictionary to a Customer domain object. */
export const toCustomer = (dict: Dictionary): Customer => {
  if (!dict['id']) notValid('Customer dictionary missing required field: id')
  if (!dict['name']) notValid('Customer dictionary missing required field: name')
  if (!dict['status']) notValid('Customer dictionary missing required field: status')
  if (!dict['line1']) notValid('Customer dictionary missing required field: line1')
  if (!dict['city']) notValid('Customer dictionary missing required field: city')
  if (!dict['state']) notValid('Customer dictionary missing required field: state')
  if (!dict['postal_code']) notValid('Customer dictionary missing required field: postal_code')
  if (!dict['country']) notValid('Customer dictionary missing required field: country')
  if (!dict['created_at']) notValid('Customer dictionary missing required field: created_at')
  if (!dict['updated_at']) notValid('Customer dictionary missing required field: updated_at')

  return {
    id: dict['id'] as string,
    name: dict['name'] as string,
    status: dict['status'] as Customer['status'],
    line1: dict['line1'] as string,
    line2: dict['line2'] as string | undefined,
    city: dict['city'] as string,
    state: dict['state'] as string,
    postalCode: dict['postal_code'] as string,
    country: dict['country'] as string,
    accountManagerId: dict['account_manager_id'] as string | undefined,
    primaryContactId: dict['primary_contact_id'] as string | undefined,
    sites: (dict['sites'] ?? []) as Customer['sites'],
    contacts: (dict['contacts'] ?? []) as Customer['contacts'],
    notes: (dict['notes'] ?? []) as Customer['notes'],
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined
  }
}

/** Convert a Customer domain object to a Dictionary. */
export const fromCustomer = (customer: Customer): Dictionary => ({
  id: customer.id,
  name: customer.name,
  status: customer.status,
  line1: customer.line1,
  line2: customer.line2,
  city: customer.city,
  state: customer.state,
  postal_code: customer.postalCode,
  country: customer.country,
  account_manager_id: customer.accountManagerId,
  primary_contact_id: customer.primaryContactId,
  sites: customer.sites,
  contacts: customer.contacts,
  notes: customer.notes,
  created_at: customer.createdAt,
  updated_at: customer.updatedAt,
  deleted_at: customer.deletedAt
})
