/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Chemical protocol types                                                      ║
║ Boundary payload contracts for chemical topic abstractions.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines create and update protocol payload shapes for chemical abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ChemicalCreate  Create payload for Chemical.
ChemicalUpdate  Update payload for Chemical.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { Chemical } from '@domain/abstractions/chemical.ts'

/* Chemical protocol */
export type ChemicalCreate = CreateFromInstantiable<Chemical>
export type ChemicalUpdate = UpdateFromInstantiable<Chemical>
