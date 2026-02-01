/**
 * Protocol types for asset operations.
 * Defines wire shapes for request/response contracts.
 */

import type { Asset } from '@domain/abstractions/asset.ts'

/** Input type for creating an asset. */
export interface AssetCreateInput {
  label: string
  description?: string
  serialNumber?: string
  type: string
  status?: Asset['status']
}

/** Input type for updating an asset. */
export interface AssetUpdateInput {
  id: string
  label?: string
  description?: string | null
  serialNumber?: string | null
  type?: string
  status?: Asset['status']
}
