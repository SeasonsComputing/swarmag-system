/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer domain adapter                                                      ║
║ Serialization for customer topic abstractions.                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Serializes between Dictionary and Customer domain types, including the
embedded Contact and CustomerSite compositions.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
toCustomer    Deserialize Customer from a storage dictionary.
fromCustomer  Serialize Customer to a storage dictionary.
*/

import type {
  AssociationOne,
  AssociationOptional,
  CompositionMany,
  CompositionOne,
  CompositionPositive,
  Dictionary,
  Id,
  When
} from '@core-std'
import type { Location, Note } from '@domain/abstractions/common.ts'
import type {
  Contact,
  ContactChannel,
  Customer,
  CustomerSite,
  CustomerStatus
} from '@domain/abstractions/customer.ts'
import type { User } from '@domain/abstractions/user.ts'
import { fromLocation, fromNote, toLocation, toNote } from '@domain/adapters/common-adapter.ts'

/** Deserialize Customer from a storage dictionary. */
export const toCustomer = (dict: Dictionary): Customer => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  accountManagerId: dict.account_manager_id as AssociationOptional<User>,
  sites: (dict.sites as Dictionary[]).map(toCustomerSite) as CompositionMany<CustomerSite>,
  contacts: (dict.contacts as Dictionary[]).map(toContact) as CompositionPositive<Contact>,
  notes: (dict.notes as Dictionary[]).map(toNote) as CompositionMany<Note>,
  name: dict.name as string,
  status: dict.status as CustomerStatus,
  line1: dict.line1 as string,
  line2: dict.line2 as string | undefined,
  city: dict.city as string,
  state: dict.state as string,
  postalCode: dict.postal_code as string,
  country: dict.country as string
})

/** Serialize Customer to a storage dictionary. */
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
  line1: customer.line1,
  line2: customer.line2,
  city: customer.city,
  state: customer.state,
  postal_code: customer.postalCode,
  country: customer.country
})

// ────────────────────────────────────────────────────────────────────────────
// PRIVATE INTERNALS
// ────────────────────────────────────────────────────────────────────────────

const toContact = (dict: Dictionary): Contact => ({
  notes: (dict.notes as Dictionary[]).map(toNote) as CompositionMany<Note>,
  name: dict.name as string,
  email: dict.email as string | undefined,
  phone: dict.phone as string | undefined,
  isPrimary: dict.is_primary as boolean,
  preferredChannel: dict.preferred_channel as ContactChannel
})

const fromContact = (contact: Contact): Dictionary => ({
  notes: contact.notes.map(fromNote),
  name: contact.name,
  email: contact.email,
  phone: contact.phone,
  is_primary: contact.isPrimary,
  preferred_channel: contact.preferredChannel
})

const toCustomerSite = (dict: Dictionary): CustomerSite => ({
  customerId: dict.customer_id as AssociationOne<Customer>,
  location: [toLocation(dict.location as Dictionary)] as CompositionOne<Location>,
  notes: (dict.notes as Dictionary[]).map(toNote) as CompositionMany<Note>,
  label: dict.label as string,
  acreage: dict.acreage as number | undefined
})

const fromCustomerSite = (site: CustomerSite): Dictionary => ({
  customer_id: site.customerId,
  location: fromLocation(site.location[0]!),
  notes: site.notes.map(fromNote),
  label: site.label,
  acreage: site.acreage
})
