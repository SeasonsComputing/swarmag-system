/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer domain adapters                                                     ║
║ Dictionary serialization for customer topic abstractions.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Maps storage dictionaries to customer abstractions and back.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toContact(dict)         Deserialize Contact from dictionary.
fromContact(contact)    Serialize Contact to dictionary.
toCustomerSite(dict)    Deserialize CustomerSite from dictionary.
fromCustomerSite(site)  Serialize CustomerSite to dictionary.
toCustomer(dict)        Deserialize Customer from dictionary.
fromCustomer(customer)  Serialize Customer to dictionary.
*/

import type { Dictionary } from '@core/std'
import type { Contact, Customer, CustomerSite } from '@domain/abstractions/customer.ts'
import { fromLocation, fromNote, toLocation, toNote } from '@domain/adapters/common-adapter.ts'

/** Deserialize Contact from dictionary. */
export const toContact = (dict: Dictionary): Contact => ({
  notes: (dict.notes as Dictionary[] | undefined ?? []).map(toNote),
  name: dict.name as string,
  email: dict.email as string | undefined,
  phone: dict.phone as string | undefined,
  isPrimary: dict.is_primary as boolean,
  preferredChannel: dict.preferred_channel as Contact['preferredChannel']
})

/** Serialize Contact to dictionary. */
export const fromContact = (contact: Contact): Dictionary => ({
  notes: contact.notes.map(fromNote),
  name: contact.name,
  email: contact.email,
  phone: contact.phone,
  is_primary: contact.isPrimary,
  preferred_channel: contact.preferredChannel
})

/** Deserialize CustomerSite from dictionary. */
export const toCustomerSite = (dict: Dictionary): CustomerSite => ({
  customerId: dict.customer_id as string,
  location: [toLocation(dict.location as Dictionary)],
  notes: (dict.notes as Dictionary[] | undefined ?? []).map(toNote),
  label: dict.label as string,
  acreage: dict.acreage as number | undefined
})

/** Serialize CustomerSite to dictionary. */
export const fromCustomerSite = (site: CustomerSite): Dictionary => ({
  customer_id: site.customerId,
  location: fromLocation(site.location[0] as never),
  notes: site.notes.map(fromNote),
  label: site.label,
  acreage: site.acreage
})

/** Deserialize Customer from dictionary. */
export const toCustomer = (dict: Dictionary): Customer => ({
  id: dict.id as string,
  createdAt: dict.created_at as string,
  updatedAt: dict.updated_at as string,
  deletedAt: dict.deleted_at as string | undefined,
  accountManagerId: dict.account_manager_id as string | undefined,
  sites: (dict.sites as Dictionary[] | undefined ?? []).map(toCustomerSite),
  contacts: (dict.contacts as Dictionary[] | undefined ?? []).map(toContact),
  notes: (dict.notes as Dictionary[] | undefined ?? []).map(toNote),
  name: dict.name as string,
  status: dict.status as Customer['status'],
  line1: dict.line_1 as string,
  line2: dict.line_2 as string | undefined,
  city: dict.city as string,
  state: dict.state as string,
  postalCode: dict.postal_code as string,
  country: dict.country as string
})

/** Serialize Customer to dictionary. */
export const fromCustomer = (customer: Customer): Dictionary => ({
  id: customer.id,
  created_at: customer.createdAt,
  updated_at: customer.updatedAt,
  deleted_at: customer.deletedAt,
  account_manager_id: customer.accountManagerId,
  sites: customer.sites.map(fromCustomerSite),
  contacts: customer.contacts.map(fromContact),
  notes: customer.notes.map(fromNote),
  name: customer.name,
  status: customer.status,
  line_1: customer.line1,
  line_2: customer.line2,
  city: customer.city,
  state: customer.state,
  postal_code: customer.postalCode,
  country: customer.country
})
