/**
 * Customer fixture samples for tests.
 */

import { id } from '@core/std'
import type { Location } from '@domain/abstractions/common.ts'
import type { Contact, Customer, CustomerUser } from '@domain/abstractions/customer.ts'

const customerId = id()
const accountManagerId = id()
const relatedContactId = id()

const ranchOfficeContact: Contact = {
  displayName: 'Marta Reyes',
  phoneNumber: '806-555-0142',
  preferredChannel: 'phone',
  email: 'marta@bluemesaranch.com'
}

const headquartersLocation: Location = {
  latitude: 33.5779,
  longitude: -101.8552,
  line1: '1200 AgriTech Way',
  city: 'Lubbock',
  state: 'TX',
  postalCode: '79401',
  country: 'US',
  description: 'Corporate HQ and main equipment depot'
}

const southFortyLocation: Location = {
  line1: '4400 County Road 2100',
  city: 'Slaton',
  state: 'TX',
  postalCode: '79364',
  country: 'US',
  description: 'Leased pasture pending onsite GPS capture'
}

export const blueMesaRanchCustomer: Customer = {
  id: customerId,
  name: 'Blue Mesa Ranch Co.',
  status: 'active',
  line1: 'PO Box 410',
  city: 'San Angelo',
  state: 'TX',
  postalCode: '76902',
  country: 'US',
  accountManagerId,
  primaryContact: [ranchOfficeContact],
  sites: [{
    customerId,
    label: 'North Pasture HQ',
    location: [headquartersLocation],
    acreage: 2400,
    notes: []
  }, {
    customerId,
    label: 'South Forty',
    location: [southFortyLocation],
    notes: []
  }],
  notes: [],
  createdAt: '2025-01-10T00:00:00Z',
  updatedAt: '2025-01-15T12:00:00Z'
}

export const blueMesaRanchContact: CustomerUser = {
  customerId,
  userId: relatedContactId
}

export const customerSamples = [blueMesaRanchCustomer]
export const customerUserSamples = [blueMesaRanchContact]
