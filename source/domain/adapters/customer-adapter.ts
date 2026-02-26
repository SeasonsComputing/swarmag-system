/**
 * Customer et al adapters to and from Dictionary representation.
 */

import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type { Contact, Customer, CustomerSite } from '@domain/abstractions/customer.ts'
import {
  fromLocation,
  fromNote,
  toLocation,
  toNote
} from '@domain/adapters/common-adapter.ts'

/** Create a Contact from serialized dictionary format */
export const toContact = (dict: Dictionary): Contact => ({
  name: dict.name as string,
  email: dict.email as string | undefined,
  phone: dict.phone as string | undefined,
  isPrimary: dict.is_primary as boolean,
  preferredChannel: dict.preferred_channel as Contact['preferredChannel'],
  notes: (dict.notes as Dictionary[]).map(toNote)
})

/** Serialize a Contact to dictionary format */
export const fromContact = (contact: Contact): Dictionary => ({
  name: contact.name,
  email: contact.email,
  phone: contact.phone,
  is_primary: contact.isPrimary,
  preferred_channel: contact.preferredChannel,
  notes: contact.notes.map(fromNote)
})

/** Create a CustomerSite from serialized dictionary format */
export const toCustomerSite = (dict: Dictionary): CustomerSite => ({
  id: dict.id as string,
  customerId: dict.customer_id as string,
  label: dict.label as string,
  location: (dict.location as Dictionary[]).map(toLocation),
  acreage: dict.acreage as number | undefined,
  notes: (dict.notes as Dictionary[]).map(toNote)
})

/** Serialize a CustomerSite to dictionary format */
export const fromCustomerSite = (site: CustomerSite): Dictionary => ({
  id: site.id,
  customer_id: site.customerId,
  label: site.label,
  location: site.location.map(fromLocation),
  acreage: site.acreage,
  notes: site.notes.map(fromNote)
})

/** Create a Customer from serialized dictionary format */
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
  return {
    id: dict.id as string,
    name: dict.name as string,
    status: dict.status as Customer['status'],
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

/** Serialize a Customer to dictionary format */
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
