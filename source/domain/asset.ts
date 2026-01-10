/**
 * Domain models for assets in the swarmAg system.
 * Assets represent equipment and resources used in operations,
 * such as vehicles, sprayers, drones, etc.
 */

import type { ID } from '@utils/identifier.ts'
import type { When } from '@utils/datetime.ts'
import type { Attachment } from '@domain/common.ts'

/** The different types of assets available in the system. */
export interface AssetType {
  id: ID;
  label: string;
  active: boolean;
  createdAt: When
  updatedAt: When
}

/** The possible statuses an asset can have. */
export type AssetStatus = 'active' | 'maintenance' | 'retired' | 'reserved'

/** Represents an asset in the swarmAg system. */
export interface Asset {
  id: ID
  label: string
  description?: string
  serialNumber?: string;
  type: ID;
  status: AssetStatus
  attachments?: Attachment[]
  createdAt: When
  updatedAt: When
}
