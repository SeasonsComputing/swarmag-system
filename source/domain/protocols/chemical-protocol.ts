/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Chemical protocol shapes                                                     ║
║ Create and update payloads for chemical topic abstractions.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines create and update protocol shapes for the Chemical abstraction.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ChemicalCreate  Create payload for a Chemical.
ChemicalUpdate  Update payload for a Chemical.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { Chemical } from '@domain/abstractions/chemical.ts'

// ────────────────────────────────────────────────────────────────────────────
// PROTOCOL
// ────────────────────────────────────────────────────────────────────────────

export type ChemicalCreate = CreateFromInstantiable<Chemical>
export type ChemicalUpdate = UpdateFromInstantiable<Chemical>
