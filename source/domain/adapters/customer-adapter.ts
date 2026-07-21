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
CustomerUserAdapter  Deserialize/Serialize CustomerUser.
CustomerAdapter      Deserialize/Serialize Customer.
*/

import { makeAdapter } from '@core/stdx'
import type { Contact, Customer, CustomerSite, CustomerUser } from '@domain/abstractions/customer.ts'
import { LocationAdapter, NoteAdapter } from '@domain/adapters/common-adapter.ts'

/** Deserialize/Serialize Contact. */
export const ContactAdapter = makeAdapter<Contact>({
  displayName: ['display_name'],
  phoneNumber: ['phone_number'],
  preferredChannel: ['preferred_channel'],
  email: ['email']
})

/** Deserialize/Serialize CustomerSite. */
export const CustomerSiteAdapter = makeAdapter<CustomerSite>({
  customerId: ['customer_id'],
  location: ['location', LocationAdapter],
  notes: ['notes', NoteAdapter],
  label: ['label'],
  acreage: ['acreage']
})

/** Deserialize/Serialize CustomerUser. */
export const CustomerUserAdapter = makeAdapter<CustomerUser>({
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
  primaryContact: ['primary_contact', ContactAdapter],
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
