/**
 * Customer domain adapters.
 */

import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'
import type {
  Contact,
  ContactPreferredChannel,
  Customer,
  CustomerSite,
  CustomerStatus
} from '@domain/abstractions/customer.ts'
import {
  fromLocation,
  fromNote,
  toLocation,
  toNote
} from '@domain/adapters/common-adapter.ts'

/** Create a Contact from its dictionary representation. */
export const toContact = (dict: Dictionary): Contact => {
  if (!dict.name) return notValid('Contact dictionary missing required field: name')
  if (dict.is_primary === undefined) {
    return notValid('Contact dictionary missing required field: is_primary')
  }
  if (!dict.notes) return notValid('Contact dictionary missing required field: notes')

  return {
    name: dict.name as string,
    email: dict.email as string | undefined,
    phone: dict.phone as string | undefined,
    isPrimary: dict.is_primary as boolean,
    preferredChannel: dict.preferred_channel as ContactPreferredChannel | undefined,
    notes: (dict.notes as Note[]).map(toNote)
  }
}

/** Create a dictionary representation from a Contact. */
export const fromContact = (contact: Contact): Dictionary => ({
  name: contact.name,
  email: contact.email,
  phone: contact.phone,
  is_primary: contact.isPrimary,
  preferred_channel: contact.preferredChannel,
  notes: contact.notes.map(fromNote)
})

/** Create a CustomerSite from its dictionary representation. */
export const toCustomerSite = (dict: Dictionary): CustomerSite => {
  if (!dict.customer_id) {
    return notValid('CustomerSite dictionary missing required field: customer_id')
  }
  if (!dict.label) {
    return notValid('CustomerSite dictionary missing required field: label')
  }
  if (!dict.location) {
    return notValid('CustomerSite dictionary missing required field: location')
  }
  if (!dict.notes) {
    return notValid('CustomerSite dictionary missing required field: notes')
  }

  return {
    customerId: dict.customer_id as string,
    label: dict.label as string,
    acreage: dict.acreage as number | undefined,
    location: (dict.location as Dictionary[]).map(toLocation),
    notes: (dict.notes as Note[]).map(toNote)
  }
}

/** Create a dictionary representation from a CustomerSite. */
export const fromCustomerSite = (site: CustomerSite): Dictionary => ({
  customer_id: site.customerId,
  label: site.label,
  acreage: site.acreage,
  location: site.location.map(fromLocation),
  notes: site.notes.map(fromNote)
})

/** Create a Customer from its dictionary representation. */
export const toCustomer = (dict: Dictionary): Customer => {
  if (!dict.id) return notValid('Customer dictionary missing required field: id')
  if (!dict.name) return notValid('Customer dictionary missing required field: name')
  if (!dict.status) return notValid('Customer dictionary missing required field: status')
  if (!dict.line1) return notValid('Customer dictionary missing required field: line1')
  if (!dict.city) return notValid('Customer dictionary missing required field: city')
  if (!dict.state) return notValid('Customer dictionary missing required field: state')
  if (!dict.postal_code) {
    return notValid('Customer dictionary missing required field: postal_code')
  }
  if (!dict.country) {
    return notValid('Customer dictionary missing required field: country')
  }
  if (!dict.sites) return notValid('Customer dictionary missing required field: sites')
  if (!dict.contacts) {
    return notValid('Customer dictionary missing required field: contacts')
  }
  if (!dict.notes) return notValid('Customer dictionary missing required field: notes')
  if (!dict.created_at) {
    return notValid('Customer dictionary missing required field: created_at')
  }
  if (!dict.updated_at) {
    return notValid('Customer dictionary missing required field: updated_at')
  }

  return {
    id: dict.id as string,
    name: dict.name as string,
    status: dict.status as CustomerStatus,
    line1: dict.line1 as string,
    line2: dict.line2 as string | undefined,
    city: dict.city as string,
    state: dict.state as string,
    postalCode: dict.postal_code as string,
    country: dict.country as string,
    accountManagerId: dict.account_manager_id as string | undefined,
    sites: (dict.sites as Dictionary[]).map(toCustomerSite),
    contacts: (dict.contacts as Dictionary[]).map(toContact),
    notes: (dict.notes as Note[]).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation from a Customer. */
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
  sites: customer.sites.map(fromCustomerSite),
  contacts: customer.contacts.map(fromContact),
  notes: customer.notes.map(fromNote),
  created_at: customer.createdAt,
  updated_at: customer.updatedAt,
  deleted_at: customer.deletedAt
})
