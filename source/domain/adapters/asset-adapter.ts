/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Asset domain adapters                                                        ║
║ Dictionary serialization for asset topic abstractions.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Maps storage dictionaries to asset abstractions and back.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AssetTypeAdapter  Deserialize/Serialize AssetType.
AssetAdapter      Deserialize/Serialize Asset.
*/

import { makeAdapter } from '@core/stdx'
import type { Asset, AssetType } from '@domain/abstractions/asset.ts'
import { NoteAdapter } from '@domain/adapters/common-adapter.ts'

/** Deserialize/Serialize AssetType. */
export const AssetTypeAdapter = makeAdapter<AssetType>({
  id: ['id'],
  createdAt: ['created_at'],
  updatedAt: ['updated_at'],
  deletedAt: ['deleted_at'],
  label: ['label'],
  active: ['active']
})

/** Deserialize/Serialize Asset. */
export const AssetAdapter = makeAdapter<Asset>({
  id: ['id'],
  createdAt: ['created_at'],
  updatedAt: ['updated_at'],
  deletedAt: ['deleted_at'],
  type: ['type_id'],
  notes: ['notes', NoteAdapter],
  label: ['label'],
  description: ['description'],
  serialNumber: ['serial_number'],
  status: ['status']
})
