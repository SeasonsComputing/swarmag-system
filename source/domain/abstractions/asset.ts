/**
 * Domain models for assets in the swarmAg system.
 * Assets represent equipment and resources used in operations,
 * such as vehicles, sprayers, and drones.
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

/** Lifecycle and availability state of an asset. */
export type AssetStatus =
  | 'active'
  | 'maintenance'
  | 'retired'
  | 'reserved'

/** Operational equipment or resource used to perform services. */
export type Asset = {
  id: Id
  label: string
  description?: string
  serialNumber?: string
  /** References AssetType.id */
  type: Id
  status: AssetStatus
  notes: [Note?, ...Note[]]
  createdAt: When
  updatedAt: When
  deletedAt?: When
}
