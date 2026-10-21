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

SEMANTICS
───────────────────────────────────────────────────────────────────────────────
Drafts never share object or array structure with their source, coming in or
going out. Compositions have no identity; draft owners copy their values when
opening, accepting changes, snapshotting a baseline, and projecting a result.
copyDraft uses structuredClone(unwrap(value)) to copy plain domain values and
Solid store data at every nested level. Draft data must remain plain and
cloneable; functions and class instances do not belong in it.
*/

import { unwrap } from '@solid-js/store'

/** Copy draft inputs and outputs without retaining source structure. */
export const copyDraft = <T>(value: T): T => structuredClone(unwrap(value))
