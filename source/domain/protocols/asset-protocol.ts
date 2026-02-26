/**
 * Protocol input shapes for Asset boundary operations.
 */

import type { Id } from '@core-std'
import type { AssetStatus } from '@domain/abstractions/asset.ts'

/** Input for creating an AssetType. */
export type AssetTypeCreateInput = {
  label: string
  active: boolean
}

/** Input for updating an AssetType. */
export type AssetTypeUpdateInput = {
  id: Id
  label?: string
  active?: boolean
}

/** Input for creating an Asset. */
export type AssetCreateInput = {
  label: string
  type: Id
  status: AssetStatus
}

/** Input for updating an Asset. */
export type AssetUpdateInput = {
  id: Id
  label?: string
  type?: Id
  status?: AssetStatus
}
