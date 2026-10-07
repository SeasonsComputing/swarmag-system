/**
 * Facet catalog fixture for adapter and boundary validation tests.
 */

import { id } from '@core/std'
import type { Facet } from '@domain/abstractions/common.ts'

/** A path-like code whose slash carries no matching semantics. */
export const aerialSprayFacet: Facet = {
  id: id(),
  scheme: 'service',
  code: 'aerial/spray',
  label: 'Aerial spray',
  description: 'Classification for aerial spraying workflows.',
  active: true,
  createdAt: '2026-10-06T00:00:00Z',
  updatedAt: '2026-10-06T00:00:00Z'
}

/** Every facet fixture, for integrity checks. */
export const facetSamples: readonly Facet[] = [aerialSprayFacet]
