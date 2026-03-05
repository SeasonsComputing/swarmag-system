/**
 * Asset domain abstractions.
 */

import type { AssociationOne, CompositionMany, Instantiable } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'

/** Reference type for categorizing assets. */
export type AssetType = Instantiable & {
  label: string
  active: boolean
}

/** Lifecycle and availability state. */
export const ASSET_STATUSES = ['active', 'maintenance', 'retired', 'reserved'] as const
export type AssetStatus = (typeof ASSET_STATUSES)[number]

/** Operational equipment or resource. */
export type Asset = Instantiable & {
  type: AssociationOne<AssetType>
  notes: CompositionMany<Note>
  label: string
  description?: string
  serialNumber?: string
  status: AssetStatus
}
