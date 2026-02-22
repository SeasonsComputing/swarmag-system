/**
 * Adapter for converting between Dictionary (storage) and Customer domain abstractions.
 * Maps snake_case column names to camelCase domain fields and back.
 */

import type { Dictionary } from '@core-std'
import type { Contact, CustomerSite, Customer } from '@domain/abstractions/customer.ts'

/** Converts a storage dictionary to a Contact domain object. */
export const toContact = (dict: Dictionary): Contact => {
  if (!dict['id']) throw new Error('Contact dictionary missing required field: id')
  if (!dict['customer_id']) throw new Error('Contact dictionary missing required field: customer_id')
  if (!dict['name']) throw new Error('Contact dictionary missing required field: name')
  if (!dict['created_at']) throw new Error('Contact dictionary missing required field: created_at')
  if (!dict['updated_at']) throw new Error('Contact dictionary missing required field: updated_at')

  return {
    id: dict['id'] as string,
    customerId: dict['customer_id'] as string,
    name: dict['name'] as string,
    email: dict['email'] as string | undefined,
    phone: dict['phone'] as string | undefined,
    preferredChannel: dict['preferred_channel'] as Contact['preferredChannel'],
    notes: (dict['notes'] ?? []) as Contact['notes'],
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
  }
}

/** Converts a Contact domain object to a storage dictionary. */
export const fromContact = (contact: Contact): Dictionary => ({
  id: contact.id,
  customer_id: contact.customerId,
  name: contact.name,
  email: contact.email,
  phone: contact.phone,
  preferred_channel: contact.preferredChannel,
  notes: contact.notes,
  created_at: contact.createdAt,
  updated_at: contact.updatedAt,
})

/** Converts a storage dictionary to a CustomerSite domain object. */
export const toCustomerSite = (dict: Dictionary): CustomerSite => {
  if (!dict['id']) throw new Error('CustomerSite dictionary missing required field: id')
  if (!dict['customer_id']) throw new Error('CustomerSite dictionary missing required field: customer_id')
  if (!dict['label']) throw new Error('CustomerSite dictionary missing required field: label')
  if (!dict['location']) throw new Error('CustomerSite dictionary missing required field: location')

  return {
    id: dict['id'] as string,
    customerId: dict['customer_id'] as string,
    label: dict['label'] as string,
    location: dict['location'] as CustomerSite['location'],
    acreage: dict['acreage'] as number | undefined,
    notes: (dict['notes'] ?? []) as CustomerSite['notes'],
  }
}

/** Converts a CustomerSite domain object to a storage dictionary. */
export const fromCustomerSite = (site: CustomerSite): Dictionary => ({
  id: site.id,
  customer_id: site.customerId,
  label: site.label,
  location: site.location,
  acreage: site.acreage,
  notes: site.notes,
})

/** Converts a storage dictionary to a Customer domain object. */
export const toCustomer = (dict: Dictionary): Customer => {
  if (!dict['id']) throw new Error('Customer dictionary missing required field: id')
  if (!dict['name']) throw new Error('Customer dictionary missing required field: name')
  if (!dict['status']) throw new Error('Customer dictionary missing required field: status')
  if (!dict['line1']) throw new Error('Customer dictionary missing required field: line1')
  if (!dict['city']) throw new Error('Customer dictionary missing required field: city')
  if (!dict['state']) throw new Error('Customer dictionary missing required field: state')
  if (!dict['postal_code']) throw new Error('Customer dictionary missing required field: postal_code')
  if (!dict['country']) throw new Error('Customer dictionary missing required field: country')
  if (!dict['created_at']) throw new Error('Customer dictionary missing required field: created_at')
  if (!dict['updated_at']) throw new Error('Customer dictionary missing required field: updated_at')

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
    contacts: (dict['contacts'] as Customer['contacts']),
    notes: (dict['notes'] ?? []) as Customer['notes'],
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined,
  }
}

/** Converts a Customer domain object to a storage dictionary. */
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
  deleted_at: customer.deletedAt,
})
