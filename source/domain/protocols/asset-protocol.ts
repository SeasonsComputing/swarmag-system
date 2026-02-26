/**
 * Protocol input shapes for Asset boundary operations.
 */

import type { Id } from '@core-std'
import type { AssetStatus } from '@domain/abstractions/asset.ts'

/** Input for creating an AssetType. */
export type AssetTypeCreate = {
  label: string
  active: boolean
}

/** Input for updating an AssetType. */
export type AssetTypeUpdate = {
  id: Id
  label?: string
  active?: boolean
}

/** Input for creating an Asset. */
export type AssetCreate = {
  label: string
  type: Id
  status: AssetStatus
}

/** Input for updating an Asset. */
export type AssetUpdate = {
  id: Id
  label?: string
  type?: Id
  status?: AssetStatus
}
