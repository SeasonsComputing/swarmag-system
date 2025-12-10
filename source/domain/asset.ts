/**
 * Domain models for assets in the swarmAg system.
 * Assets represent equipment and resources used in operations,
 * such as vehicles, sprayers, drones, etc.
 */

import type { ID } from '@utils/identifier'
import type { When } from '@utils/datetime'
import type { Attachment } from './common'

/** The different types of assets available in the system. */
export type AssetType =
  | 'skidsteer-vehicle'
  | 'toolcat-vehicle'
  | 'vehicle-tool-attachment'
  | 'mapping-drone'
  | 'dispensing-drone'
  | 'drone-bucket-wet'
  | 'drone-bucket-dry'

/** The possible statuses an asset can have. */
export type AssetStatus = 'active' | 'maintenance' | 'retired' | 'reserved'

/** Represents an asset entity in the swarmAg system. */
export interface Asset {
  id: ID
  label: string
  description?: string
  type: AssetType
  status: AssetStatus
  attachments?: Attachment[]
  createdAt: When
  updatedAt: When
}
