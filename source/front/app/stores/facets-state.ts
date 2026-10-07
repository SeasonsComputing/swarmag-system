/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Facet catalog query state                                                    ║
║ Shared classification reads over the server-owned catalog.                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Hides the cached query and resolves facet references, including inactive entries.
First-page loading remains until the shared paging repair required before seeding.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FacetsState  Intent-based catalog reads and refresh.
useFacets()  Access the shared cached catalog inside the component tree.
*/

import { StringSet } from '@core/std'
import type { Facet } from '@domain/abstractions/common.ts'
import { api } from '@front/api/api.ts'
import { createQuery, useQueryClient } from '@tanstack/solid-query'

/** Shared catalog access; unresolved labels preserve their scheme:code reference. */
export type FacetsState = {
  ready: () => boolean
  failed: () => boolean
  schemes: () => readonly string[]
  codes: (scheme: string) => readonly string[]
  label: (scheme: string, code: string) => string
  labelRef: (ref: string) => string
  labelRefs: (refs: readonly string[]) => readonly string[]
  refresh: () => Promise<void>
}

/** Access the cached facet catalog within the QueryClient component tree. */
export const useFacets = (): FacetsState => {
  const client = useQueryClient()
  const query = createQuery(() => ({
    queryKey: FACETS_QUERY_KEY,
    queryFn: loadFacets,
    staleTime: Infinity
  }))
  const facets = (): readonly Facet[] => query.data ?? []
  const labelRef = (ref: string): string =>
    facets().find(facet => `${facet.scheme}:${facet.code}` === ref)?.label ?? ref
  const label = (scheme: string, code: string): string => labelRef(`${scheme}:${code}`)
  return {
    ready: () => query.isSuccess,
    failed: () => query.isError,
    schemes: () => [...new StringSet(facets().map(facet => facet.scheme))].sort(),
    codes: scheme =>
      facets().filter(facet => facet.scheme === scheme && facet.active).map(facet => facet.code).sort(),
    label,
    labelRef,
    labelRefs: refs => refs.map(labelRef),
    refresh: () => client.invalidateQueries({ queryKey: FACETS_QUERY_KEY })
  }
}

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

const FACETS_QUERY_KEY = ['facets'] as const

const loadFacets = async (): Promise<readonly Facet[]> => (await api.Facets.list()).data
