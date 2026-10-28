/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Facet fixtures                                                               ║
║ Shared classification catalog for adapter and validation tests.              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Facet catalog fixture for adapter and boundary validation tests.

Shared classification catalog for adapter and validation tests.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FacetSamples  Shared fixture samples.
├ aerialSpray             Service facet with a path-like code.
│ ├ Instantiable           Inherited Instantiable fields.
│ ├ scheme                 Classification scheme.
│ ├ code                   Classification code.
│ ├ label                  Display label.
│ ├ description            Optional descriptive text.
│ └ active                 Catalog availability.
└ all                     All facet records.
*/

import { id, toWhen } from '@core/std'
import type { Facet } from '@domain/abstractions/common.ts'

/** A path-like code whose slash carries no matching semantics. */
const AerialSpray: Facet = {
  id: id(),
  scheme: 'service',
  code: 'aerial/spray',
  label: 'Aerial spray',
  description: 'Classification for aerial spraying workflows.',
  active: true,
  createdAt: toWhen('2026-10-06T00:00:00Z'),
  updatedAt: toWhen('2026-10-06T00:00:00Z')
}

/** Every facet fixture, for integrity checks. */
const ALL: readonly Facet[] = [AerialSpray]

/** Shared fixture samples. */
export const FacetSamples = {
  aerialSpray: AerialSpray,
  all: ALL
}
