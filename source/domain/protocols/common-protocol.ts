/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Common protocol types                                                        ║
║ Boundary payload contracts for shared abstractions.                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines create and update protocol payload shapes for Facet.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FacetCreate  Create payload for Facet.
FacetUpdate  Update payload for Facet.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { Facet } from '@domain/abstractions/common.ts'

/** Create payload for Facet. */
export type FacetCreate = CreateFromInstantiable<Facet>

/** Update payload for Facet. */
export type FacetUpdate = UpdateFromInstantiable<Facet>
