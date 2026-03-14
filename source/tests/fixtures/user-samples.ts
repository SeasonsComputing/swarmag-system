/**
 * User fixture samples for tests.
 */

import { id } from '@core/std'
import type { User } from '@domain/abstractions/user.ts'

export const administratorUserSample: User = {
  id: id(),
  roles: ['administrator'],
  displayName: 'Morgan Dale',
  primaryEmail: 'morgan.dale@swarmag.example',
  phoneNumber: '+1-325-555-0111',
  avatarUrl: 'https://example.com/avatars/morgan-dale.png',
  status: 'active',
  createdAt: '2025-01-10T00:00:00Z',
  updatedAt: '2025-01-10T00:00:00Z'
}

export const operationsUserSample: User = {
  id: id(),
  roles: ['operations'],
  displayName: 'Sloane Mercer',
  primaryEmail: 'sloane.mercer@swarmag.example',
  phoneNumber: '+1-325-555-0122',
  avatarUrl: 'https://example.com/avatars/sloane-mercer.png',
  status: 'active',
  createdAt: '2025-01-10T00:00:00Z',
  updatedAt: '2025-01-11T00:00:00Z'
}

export const salesUserSample: User = {
  id: id(),
  roles: ['sales'],
  displayName: 'Reese Vaughn',
  primaryEmail: 'reese.vaughn@swarmag.example',
  phoneNumber: '+1-325-555-0133',
  avatarUrl: 'https://example.com/avatars/reese-vaughn.png',
  status: 'active',
  createdAt: '2025-01-12T00:00:00Z',
  updatedAt: '2025-01-12T00:00:00Z'
}

export const userSamples: User[] = [
  administratorUserSample,
  operationsUserSample,
  salesUserSample
]
