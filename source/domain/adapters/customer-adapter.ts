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
CustomerSiteAdapter     Deserialize/Serialize CustomerSite.
CustomerContactAdapter  Deserialize/Serialize CustomerContact.
CustomerAdapter         Deserialize/Serialize Customer.
*/

import { makeAdapter } from '@core/stdx'
import type { Customer, CustomerContact, CustomerSite } from '@domain/abstractions/customer.ts'
import { LocationAdapter, NoteAdapter } from '@domain/adapters/common-adapter.ts'

/** Deserialize/Serialize CustomerSite. */
export const CustomerSiteAdapter = makeAdapter<CustomerSite>({
  customerId: ['customer_id'],
  location: ['location', LocationAdapter],
  notes: ['notes', NoteAdapter],
  label: ['label'],
  acreage: ['acreage']
})

/** Deserialize/Serialize CustomerContact. */
export const CustomerContactAdapter = makeAdapter<CustomerContact>({
  customerId: ['customer_id'],
  userId: ['user_id']
})

/** Deserialize/Serialize Customer. */
export const CustomerAdapter = makeAdapter<Customer>({
  id: ['id'],
  createdAt: ['created_at'],
  updatedAt: ['updated_at'],
  deletedAt: ['deleted_at'],
  accountManagerId: ['account_manager_id'],
  primaryContactId: ['primary_contact_id'],
  sites: ['sites', CustomerSiteAdapter],
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
