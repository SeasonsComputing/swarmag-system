/**
 * Domain abstractions for assets in the swarmAg system.
 * Assets represent equipment and resources used in field operations.
 */

import type { Id, When } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'

/** Reference type for categorizing assets. */
export type AssetType = {
  id: Id
  label: string
  active: boolean
  createdAt: When
  updatedAt: When
  deletedAt?: When
}

/** Lifecycle and availability state. */
export type AssetStatus =
  | 'active'
  | 'maintenance'
  | 'retired'
  | 'reserved'

/** Operational equipment or resource. */
export type Asset = {
  id: Id
  label: string
  description?: string
  serialNumber?: string
  type: Id
  status: AssetStatus
  notes: [Note?, ...Note[]]
  createdAt: When
  updatedAt: When
  deletedAt?: When
}
