/**
 * Adapters for the customer domain area: Contact, CustomerSite, and Customer.
 */

import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type {
  Contact,
  ContactChannel,
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

const toContact = (dict: Dictionary): Contact => {
  if (!dict.name) return notValid('Contact dictionary missing required field: name')
  return {
    name: dict.name as string,
    email: dict.email as string | undefined,
    phone: dict.phone as string | undefined,
    isPrimary: dict.is_primary as boolean,
    preferredChannel: dict.preferred_channel as ContactChannel | undefined,
    notes: (dict.notes as Dictionary[]).map(toNote)
  }
}

const fromContact = (contact: Contact): Dictionary => ({
  name: contact.name,
  email: contact.email,
  phone: contact.phone,
  is_primary: contact.isPrimary,
  preferred_channel: contact.preferredChannel,
  notes: contact.notes.map(fromNote)
})

const toCustomerSite = (dict: Dictionary): CustomerSite => {
  if (!dict.customer_id) {
    return notValid('CustomerSite dictionary missing required field: customer_id')
  }
  if (!dict.label) {
    return notValid('CustomerSite dictionary missing required field: label')
  }
  return {
    customerId: dict.customer_id as string,
    location: (dict.location as Dictionary[]).map(toLocation),
    label: dict.label as string,
    acreage: dict.acreage as number | undefined,
    notes: (dict.notes as Dictionary[]).map(toNote)
  }
}

const fromCustomerSite = (site: CustomerSite): Dictionary => ({
  customer_id: site.customerId,
  location: site.location.map(fromLocation),
  label: site.label,
  acreage: site.acreage,
  notes: site.notes.map(fromNote)
})

/** Create a Customer instance from dictionary representation. */
export const toCustomer = (dict: Dictionary): Customer => {
  if (!dict.id) return notValid('Customer dictionary missing required field: id')
  if (!dict.name) return notValid('Customer dictionary missing required field: name')
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
    notes: (dict.notes as Dictionary[]).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation of a Customer instance. */
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
