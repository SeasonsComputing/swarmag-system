/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Customer domain adapters                                                    ║
║ Dictionary serialization for customer topic abstractions                    ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Serializes customer topic abstractions between Dictionary and domain shapes.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toContact                           Deserialize Contact from Dictionary.
fromContact                         Serialize Contact to Dictionary.
toCustomerSite                      Deserialize CustomerSite from Dictionary.
fromCustomerSite                    Serialize CustomerSite to Dictionary.
toCustomer                          Deserialize Customer from Dictionary.
fromCustomer                        Serialize Customer to Dictionary.
*/

import type { Dictionary, Id, When } from '@core/std'
import type { Contact, Customer, CustomerSite } from '@domain/abstractions/customer.ts'
import { fromLocation, fromNote, toLocation, toNote } from '@domain/adapters/common-adapter.ts'

/** Deserialize Contact from Dictionary. */
export const toContact = (dict: Dictionary): Contact => ({
  notes: (dict.notes as Dictionary[]).map(toNote),
  name: dict.name as string,
  email: dict.email as string | undefined,
  phone: dict.phone as string | undefined,
  isPrimary: dict.is_primary as boolean,
  preferredChannel: dict.preferred_channel as Contact['preferredChannel']
})

/** Serialize Contact to Dictionary. */
export const fromContact = (contact: Contact): Dictionary => ({
  notes: contact.notes.map(fromNote),
  name: contact.name,
  email: contact.email,
  phone: contact.phone,
  is_primary: contact.isPrimary,
  preferred_channel: contact.preferredChannel
})

/** Deserialize CustomerSite from Dictionary. */
export const toCustomerSite = (dict: Dictionary): CustomerSite => ({
  customerId: dict.customer_id as Id,
  location: (dict.location as Dictionary[]).map(toLocation),
  notes: (dict.notes as Dictionary[]).map(toNote),
  label: dict.label as string,
  acreage: dict.acreage as number | undefined
})

/** Serialize CustomerSite to Dictionary. */
export const fromCustomerSite = (customerSite: CustomerSite): Dictionary => ({
  customer_id: customerSite.customerId,
  location: customerSite.location.map(fromLocation),
  notes: customerSite.notes.map(fromNote),
  label: customerSite.label,
  acreage: customerSite.acreage
})

/** Deserialize Customer from Dictionary. */
export const toCustomer = (dict: Dictionary): Customer => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  accountManagerId: dict.account_manager_id as Id | undefined,
  sites: (dict.sites as Dictionary[]).map(toCustomerSite),
  contacts: (dict.contacts as Dictionary[]).map(toContact),
  notes: (dict.notes as Dictionary[]).map(toNote),
  name: dict.name as string,
  status: dict.status as Customer['status'],
  line1: dict.line_1 as string,
  line2: dict.line_2 as string | undefined,
  city: dict.city as string,
  state: dict.state as string,
  postalCode: dict.postal_code as string,
  country: dict.country as string
})

/** Serialize Customer to Dictionary. */
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
