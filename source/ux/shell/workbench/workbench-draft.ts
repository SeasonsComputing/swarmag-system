/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Workbench draft                                                              ║
║ JSX-free services for isolated workbench draft values.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Copies draft inputs and outputs independently of their source structure.
Compares drafts against owner-held baseline snapshots.
Keeps draft services usable by state modules without loading UI components.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
copyDraft       Copy plain values or store data without shared structure.
isDraftChanged  Compare a draft with its baseline snapshot.

SEMANTICS
───────────────────────────────────────────────────────────────────────────────
Drafts never share object or array structure with their source, coming in or
going out. Compositions have no identity; draft owners copy their values when
opening, accepting changes, snapshotting a baseline, and projecting a result.
copyDraft uses structuredClone(unwrap(value)) to copy plain domain values and
Solid store data at every nested level. Draft data must remain plain and
cloneable; functions and class instances do not belong in it.

isDraftChanged compares JSON.stringify results without normalizing key order.
Object properties with undefined values compare like absent properties. Draft
owners take copyDraft baseline snapshots and retain their own draft lifetimes.
*/

import { unwrap } from '@solid-js/store'

/** Copy draft inputs and outputs without retaining source structure. */
export const copyDraft = <T>(value: T): T => structuredClone(unwrap(value))

/** Compare a plain or store-backed draft with its owner-held baseline snapshot. */
export const isDraftChanged = <T>(draft: T, baseline: T): boolean =>
  JSON.stringify(draft) !== JSON.stringify(baseline)
