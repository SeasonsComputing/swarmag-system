/**
 * Protocol input types for Asset boundary operations.
 */

import type { Id } from '@core-std'
import type { AssetStatus } from '@domain/abstractions/asset.ts'
import type { Note } from '@domain/abstractions/common.ts'

/** Input for creating an Asset. */
export type AssetCreateInput = {
  label: string
  description?: string
  serialNumber?: string
  type: Id
  status: AssetStatus
  notes?: [Note?, ...Note[]]
}

/** Input for updating an Asset. */
export type AssetUpdateInput = {
  id: Id
  label?: string
  description?: string
  serialNumber?: string
  type?: Id
  status?: AssetStatus
  notes?: [Note?, ...Note[]]
}
