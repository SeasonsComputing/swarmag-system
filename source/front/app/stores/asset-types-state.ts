/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Asset type catalog query state                                               ║
║ Shared catalog reads and mutation-driven invalidation.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Loads the complete undeleted catalog once for managers and assignment choices.
Invalidation also refreshes stored-reference queries under the catalog prefix.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ASSET_TYPES_QUERY_KEY  Shared catalog and stored-reference query prefix.
AssetTypesState       Cached catalog reads and refresh.
├ ready               Whether the catalog loaded successfully.
├ failed              Whether the catalog read failed.
├ error               The catalog failure for the manager host.
├ records             All undeleted types, including inactive types.
├ active              Types available for new assignments.
└ refresh             Invalidate catalog and stored references.
useAssetTypes         Read the catalog inside the QueryClient component tree.
*/

import { listAll } from '@core/stdx'
import type { AssetType } from '@domain/abstractions/asset.ts'
import { api } from '@front/api/api.ts'
import { createQuery, useQueryClient } from '@tanstack/solid-query'

/** Shared catalog and stored-reference query prefix. */
export const ASSET_TYPES_QUERY_KEY = ['asset-types'] as const

/** Intent-based catalog access shared by the manager and Asset picker. */
export type AssetTypesState = {
  ready: () => boolean
  failed: () => boolean
  error: () => unknown
  records: () => readonly AssetType[]
  active: () => readonly AssetType[]
  refresh: () => Promise<void>
}

/** Read the complete catalog, keeping inactive types available for resolution. */
export const useAssetTypes = (): AssetTypesState => {
  const client = useQueryClient()
  const query = createQuery(() => ({
    queryKey: ASSET_TYPES_QUERY_KEY,
    queryFn: () => Array.fromAsync(listAll(api.AssetTypes)),
    staleTime: Infinity
  }))
  const records = (): readonly AssetType[] => query.data ?? []
  return {
    ready: () => query.isSuccess,
    failed: () => query.isError,
    error: () => query.error,
    records,
    active: () => records().filter(type => type.active),
    refresh: () => client.invalidateQueries({ queryKey: ASSET_TYPES_QUERY_KEY })
  }
}
