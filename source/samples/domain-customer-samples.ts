import type { Customer } from '@domain/customer'
import type { Location } from '@domain/common'

const headquartersLocation: Location = {
  coordinate: { latitude: 33.5779, longitude: -101.8552 },
  address: {
    line1: '1200 AgriTech Way',
    city: 'Lubbock',
    state: 'TX',
    postalCode: '79401',
    country: 'US',
  },
  description: 'Corporate HQ and main equipment depot',
}

export const blueMesaRanchCustomer: Customer = {
  id: '01J0CUSTOMER00001',
  name: 'Blue Mesa Ranch Co.',
  status: 'active',
  address: {
    line1: 'PO Box 410',
    city: 'San Angelo',
    state: 'TX',
    postalCode: '76902',
    country: 'US',
  },
  accountManager: {
    id: '01HZOPS002',
    displayName: 'Nia Wright',
    roles: ['operations'],
    role: 'Account Exec',
  },
  primaryContactId: '01J0CONTACT00001',
  sites: [
    {
      id: '01J0SITE00001',
      customerId: '01J0CUSTOMER00001',
      label: 'North Pasture HQ',
      location: headquartersLocation,
      acreage: 2400,
      notes: [],
    },
  ],
  contacts: [
    {
      id: '01J0CONTACT00001',
      customerId: '01J0CUSTOMER00001',
      name: 'Sloane Ayers',
      email: 'sloane@bluemesa.example',
      phone: '+1-325-555-0110',
      preferredChannel: 'phone',
      notes: [
        {
          id: '01J0NOTE00001',
          createdAt: '2025-01-09T00:00:00Z',
          content: 'Prefers SMS for scheduling confirmations.',
        },
      ],
      createdAt: '2025-01-10T00:00:00Z',
      updatedAt: '2025-01-10T00:00:00Z',
    },
  ],
  notes: [],
  createdAt: '2025-01-10T00:00:00Z',
  updatedAt: '2025-01-15T12:00:00Z',
}

export const customerSamples = [blueMesaRanchCustomer]
