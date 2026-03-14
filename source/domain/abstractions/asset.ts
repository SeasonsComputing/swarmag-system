/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Asset domain abstractions                                                   ║
║ Asset reference and operational equipment abstractions                      ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines asset reference and operational equipment abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AssetType                          Asset type reference abstraction.
ASSET_STATUSES                     Allowed asset lifecycle states.
AssetStatus                        Asset lifecycle state union.
Asset                              Operational equipment abstraction.
*/

import type { AssociationOne, CompositionMany, Instantiable } from '@core/std'
import type { Note } from '@domain/abstractions/common.ts'

/** Reference type for categorizing assets. */
export type AssetType = Instantiable & {
  label: string
  active: boolean
}

/** Asset lifecycle and availability states. */
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
