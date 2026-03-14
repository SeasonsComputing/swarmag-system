/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Chemical protocol contracts                                                 ║
║ Create and update payload contracts for chemical topic abstractions         ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines boundary payload contracts for chemical persisted abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ChemicalCreate                     Create payload contract for Chemical.
ChemicalUpdate                     Update payload contract for Chemical.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { Chemical } from '@domain/abstractions/chemical.ts'

/** Create payload contract for Chemical. */
export type ChemicalCreate = CreateFromInstantiable<Chemical>

/** Update payload contract for Chemical. */
export type ChemicalUpdate = UpdateFromInstantiable<Chemical>
