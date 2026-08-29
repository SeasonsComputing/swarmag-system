/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Drill contract                                                               ║
║ Explicit shell contract for opening one drill-down panel from another.       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines the prop-threaded panel opening contract used by drill-down hosts and
collections.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DrillContract       Contract implemented by a drill-down host.
DrillReturnControl  Host-owned command surface for drill return navigation.
*/

import type { UiComponent } from '@front/ux/ui'

/** Contract implemented by a drill-down host to replace the current panel. */
export interface DrillContract {
  open: (panel: () => UiComponent, title: string, pathSegment?: string) => void
}

/** Host-owned command surface for returning from the active drill panel. */
export type DrillReturnControl = {
  path: () => readonly string[]
  returnTitle: () => string
  returnToIndex: () => void
}
