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
ContactAdapter       Deserialize/Serialize Contact.
CustomerSiteAdapter  Deserialize/Serialize CustomerSite.
CustomerAdapter      Deserialize/Serialize Customer.
*/

import { makeAdapter } from '@core/std'
import type { Contact, Customer, CustomerSite } from '@domain/abstractions/customer.ts'
import { LocationAdapter, NoteAdapter } from '@domain/adapters/common-adapter.ts'

/** Deserialize/Serialize Contact. */
export const ContactAdapter = makeAdapter<Contact>({
  notes: ['notes', NoteAdapter],
  name: ['name'],
  email: ['email'],
  phone: ['phone'],
  isPrimary: ['is_primary'],
  preferredChannel: ['preferred_channel']
})

/** Deserialize/Serialize CustomerSite. */
export const CustomerSiteAdapter = makeAdapter<CustomerSite>({
  customerId: ['customer_id'],
  location: ['location', LocationAdapter],
  notes: ['notes', NoteAdapter],
  label: ['label'],
  acreage: ['acreage']
})

/** Deserialize/Serialize Customer. */
export const CustomerAdapter = makeAdapter<Customer>({
  id: ['id'],
  createdAt: ['created_at'],
  updatedAt: ['updated_at'],
  deletedAt: ['deleted_at'],
  accountManagerId: ['account_manager_id'],
  sites: ['sites', CustomerSiteAdapter],
  contacts: ['contacts', ContactAdapter],
  notes: ['notes', NoteAdapter],
  name: ['name'],
  status: ['status'],
  line1: ['line1'],
  line2: ['line2'],
  city: ['city'],
  state: ['state'],
  postalCode: ['postal_code'],
  country: ['country']
})
