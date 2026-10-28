/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer fixtures                                                            ║
║ Shared customer aggregate and contact association for tests.                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Customer fixture samples for tests.

Shared customer aggregate and contact association for tests.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CustomerSamples  Shared fixture samples.
├ blueMesaRanch           Customer with a primary contact and two sites.
│ ├ Instantiable           Inherited Instantiable fields.
│ ├ accountManagerId       Optional account-manager reference.
│ ├ primaryContact         Primary reachability details.
│ ├ sites                  Customer sites.
│ ├ notes                  Note collection.
│ ├ name                   Account name.
│ ├ status                 Lifecycle status.
│ ├ line1                  Street address.
│ ├ line2                  Optional additional address.
│ ├ city                   City.
│ ├ state                  State or region.
│ ├ postalCode             Postal code.
│ └ country                Country code.
├ blueMesaRanchContact    Customer-to-User association.
│ ├ customerId             Customer reference.
│ └ userId                 User reference.
├ all                     All customer records.
└ users                   All customer-to-User associations.
*/

import { id, toWhen } from '@core/std'
import type { Location } from '@domain/abstractions/common.ts'
import type { Contact, Customer, CustomerUser } from '@domain/abstractions/customer.ts'

const CUSTOMER_ID = id()
const ACCOUNT_MANAGER_ID = id()
const RELATED_CONTACT_ID = id()

const RanchOfficeContact: Contact = {
  displayName: 'Marta Reyes',
  phoneNumber: '806-555-0142',
  preferredChannel: 'phone',
  email: 'marta@bluemesaranch.com'
}

const HeadquartersLocation: Location = {
  latitude: 33.5779,
  longitude: -101.8552,
  line1: '1200 AgriTech Way',
  city: 'Lubbock',
  state: 'TX',
  postalCode: '79401',
  country: 'US',
  description: 'Corporate HQ and main equipment depot'
}

const SouthFortyLocation: Location = {
  line1: '4400 County Road 2100',
  city: 'Slaton',
  state: 'TX',
  postalCode: '79364',
  country: 'US',
  description: 'Leased pasture pending onsite GPS capture'
}

const BlueMesaRanch: Customer = {
  id: CUSTOMER_ID,
  name: 'Blue Mesa Ranch Co.',
  status: 'active',
  line1: 'PO Box 410',
  city: 'San Angelo',
  state: 'TX',
  postalCode: '76902',
  country: 'US',
  accountManagerId: ACCOUNT_MANAGER_ID,
  primaryContact: [RanchOfficeContact],
  sites: [{
    label: 'North Pasture HQ',
    location: [HeadquartersLocation],
    acreage: 2400,
    notes: []
  }, {
    label: 'South Forty',
    location: [SouthFortyLocation],
    notes: []
  }],
  notes: [],
  createdAt: toWhen('2025-01-10T00:00:00Z'),
  updatedAt: toWhen('2025-01-15T12:00:00Z')
}

const BlueMesaRanchContact: CustomerUser = {
  customerId: CUSTOMER_ID,
  userId: RELATED_CONTACT_ID
}

const ALL = [BlueMesaRanch]
const USERS = [BlueMesaRanchContact]

/** Shared fixture samples. */
export const CustomerSamples = {
  blueMesaRanch: BlueMesaRanch,
  blueMesaRanchContact: BlueMesaRanchContact,
  all: ALL,
  users: USERS
}
