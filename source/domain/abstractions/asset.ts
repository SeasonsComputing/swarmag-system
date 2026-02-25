/**
 * Domain models for assets in the swarmAg system.
 * Assets represent equipment and resources used in operations —
 * vehicles, drones, sprayers, tools, and attachments. AssetType
 * provides a reference taxonomy for categorizing assets.
 */

import type { AssociationOne, CompositionMany, Instantiable } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'

/** Reference type for categorizing assets. */
export type AssetType = Instantiable & {
  label: string
  active: boolean
}

/** Lifecycle and availability state. */
export type AssetStatus = 'active' | 'maintenance' | 'retired' | 'reserved'

/** Operational equipment or resource. */
export type Asset = Instantiable & {
  label: string
  description?: string
  serialNumber?: string
  type: AssociationOne<AssetType>
  status: AssetStatus
  notes: CompositionMany<Note>
}
