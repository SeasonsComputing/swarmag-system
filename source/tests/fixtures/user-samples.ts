/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User fixtures                                                                ║
║ Shared administrator, operations, and sales User records.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
User fixture samples for tests.

Shared administrator, operations, and sales User records.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UserSamples  Shared fixture samples.
├ administrator           Administrator User.
│ ├ Instantiable           Inherited Instantiable fields.
│ ├ roles                  Assigned roles.
│ ├ notes                  Note collection.
│ ├ displayName            Display name.
│ ├ primaryEmail           Primary email address.
│ ├ phoneNumber            Phone number.
│ ├ preferredChannel       Preferred contact channel.
│ ├ avatarUrl              Optional avatar URL.
│ └ status                 Lifecycle status.
├ operations              Operations User.
│ ├ Instantiable           Inherited Instantiable fields.
│ ├ roles                  Assigned roles.
│ ├ notes                  Note collection.
│ ├ displayName            Display name.
│ ├ primaryEmail           Primary email address.
│ ├ phoneNumber            Phone number.
│ ├ preferredChannel       Preferred contact channel.
│ ├ avatarUrl              Optional avatar URL.
│ └ status                 Lifecycle status.
├ sales                   Sales User.
│ ├ Instantiable           Inherited Instantiable fields.
│ ├ roles                  Assigned roles.
│ ├ notes                  Note collection.
│ ├ displayName            Display name.
│ ├ primaryEmail           Primary email address.
│ ├ phoneNumber            Phone number.
│ ├ preferredChannel       Preferred contact channel.
│ ├ avatarUrl              Optional avatar URL.
│ └ status                 Lifecycle status.
└ all                     All User records.
*/

import { id } from '@core/std'
import type { User } from '@domain/abstractions/user.ts'

const Administrator: User = {
  id: id(),
  roles: ['administrator'],
  displayName: 'Morgan Dale',
  primaryEmail: 'morgan.dale@swarmag.example',
  phoneNumber: '+1-325-555-0111',
  preferredChannel: 'email',
  notes: [],
  avatarUrl: 'https://example.com/avatars/morgan-dale.png',
  status: 'active',
  createdAt: '2025-01-10T00:00:00Z',
  updatedAt: '2025-01-10T00:00:00Z'
}

const Operations: User = {
  id: id(),
  roles: ['operations'],
  displayName: 'Sloane Mercer',
  primaryEmail: 'sloane.mercer@swarmag.example',
  phoneNumber: '+1-325-555-0122',
  preferredChannel: 'text',
  notes: [],
  avatarUrl: 'https://example.com/avatars/sloane-mercer.png',
  status: 'active',
  createdAt: '2025-01-10T00:00:00Z',
  updatedAt: '2025-01-11T00:00:00Z'
}

const Sales: User = {
  id: id(),
  roles: ['sales'],
  displayName: 'Reese Vaughn',
  primaryEmail: 'reese.vaughn@swarmag.example',
  phoneNumber: '+1-325-555-0133',
  preferredChannel: 'phone',
  notes: [],
  avatarUrl: 'https://example.com/avatars/reese-vaughn.png',
  status: 'active',
  createdAt: '2025-01-12T00:00:00Z',
  updatedAt: '2025-01-12T00:00:00Z'
}

const ALL: User[] = [
  Administrator,
  Operations,
  Sales
]

/** Shared fixture samples. */
export const UserSamples = {
  administrator: Administrator,
  operations: Operations,
  sales: Sales,
  all: ALL
}
