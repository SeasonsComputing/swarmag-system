/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Asset domain abstractions                                                    ║
║ Operational equipment and resource types.                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines asset type reference records, lifecycle status enumeration, and the
Asset abstraction for operational equipment and resources.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
AssetType     Reference type for categorizing assets.
ASSET_STATUSES  Canonical asset status values.
AssetStatus   Lifecycle and availability state.
Asset         Operational equipment or resource.
*/

import type { AssociationOne, CompositionMany, Instantiable } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'

/** Reference type for categorizing assets. */
export type AssetType = Instantiable & {
  label: string
  active: boolean
}

/** Canonical asset status values. */
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
