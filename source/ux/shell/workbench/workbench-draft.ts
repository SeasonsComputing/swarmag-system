/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Workbench draft                                                              ║
║ JSX-free services for isolated workbench draft values.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Copies draft inputs and outputs independently of their source structure.
Keeps draft services usable by state modules without loading UI components.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
copyDraft  Copy plain values or store data without shared structure.
*/

import { unwrap } from '@solid-js/store'

/** Copy draft inputs and outputs without retaining source structure. */
export const copyDraft = <T>(value: T): T => structuredClone(unwrap(value))
