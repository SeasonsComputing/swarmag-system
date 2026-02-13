/**
 * Domain models for assets in the swarmAg system.
 * Assets represent equipment and resources used in operations,
 * such as vehicles, sprayers, drones, etc.
 */

import type { Attachment } from '@domain/abstractions/common.ts'
import type { ID, When } from '@core-std'

/** The different types of assets available in the system. */
export interface AssetType {
  id: ID
  label: string
  active: boolean
  createdAt: When
  updatedAt: When
  deletedAt?: When
}

/** The possible statuses an asset can have. */
export type AssetStatus =
  | 'active'
  | 'maintenance'
  | 'retired'
  | 'reserved'

/** Represents an asset in the swarmAg system. */
export interface Asset {
  id: ID
  label: string
  description?: string
  serialNumber?: string
  type: ID
  status: AssetStatus
  attachments?: Attachment[]
  createdAt: When
  updatedAt: When
  deletedAt?: When
}
