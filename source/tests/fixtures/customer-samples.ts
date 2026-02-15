/**
 * Customer fixture samples for tests.
 */

import { id } from '@core-std'
import type { Location } from '@domain/abstractions/common.ts'
import type { Customer } from '@domain/abstractions/customer.ts'

const customerId = id()
const accountManagerId = id()
const primaryContactId = id()
const siteId = id()
const contactNoteId = id()

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
  primaryContactId,
  sites: [{
    id: siteId,
    customerId,
    label: 'North Pasture HQ',
    location: headquartersLocation,
    acreage: 2400,
    notes: []
  }],
  contacts: [{
    id: primaryContactId,
    customerId,
    name: 'Sloane Ayers',
    email: 'sloane@bluemesa.example',
    phone: '+1-325-555-0110',
    preferredChannel: 'phone',
    notes: [{
      id: contactNoteId,
      createdAt: '2025-01-09T00:00:00Z',
      content: 'Prefers SMS for scheduling confirmations.',
      images: []
    }],
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z'
  }],
  notes: [],
  createdAt: '2025-01-10T00:00:00Z',
  updatedAt: '2025-01-15T12:00:00Z'
}

export const customerSamples = [blueMesaRanchCustomer]
