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
DrillContract  Contract implemented by a drill-down host.
*/

import type { UiComponent } from '@front/ux/ui'

/** Contract implemented by a drill-down host to replace the current panel. */
export interface DrillContract {
  open: (panel: () => UiComponent, title: string) => void
}
