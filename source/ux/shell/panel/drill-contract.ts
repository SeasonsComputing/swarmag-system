/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Drill contract                                                               ║
║ Explicit shell contract for opening one drill-down panel from another.       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
The contracts between a drill-down host, the panels it opens, and the surface
that hosts it. Panels open one another through DrillContract and receive
DrillPanelContext; the hosting surface gives DrillDown a DrillHostContext to own
the return control and header, and receives a DrillReturnControl.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DrillContract             Opens a panel in place of the current one.
└ open                    Opens a panel with its title and path segment.
DrillHostContext          What a hosting surface gives DrillDown.
├ registerDrillReturn     Receives the return control, or null at the root.
├ registerTrailingAction  Optional: receives the active panel's Save.
└ registerDirty           Optional: joins open panels' dirty checks.
DrillReturnControl        The hosting surface's return command.
├ path                    The path from the root to the active panel.
├ returnTitle             The title of the panel it returns to.
└ returnToIndex           Returns one level, asking before discarding changes.
DrillPanelContext         Services owned by one opened panel.
├ isActive                The panel is the one on screen.
├ registerDirty           Joins the panel's dirty check.
├ registerSave            Supplies the panel's Save while it is active.
└ returnToParent          Returns to the panel it was opened from.
*/

import type { UiActionButtonProps, UiComponent } from '@ux/ui'

/** Contract implemented by a drill-down host to replace the current panel. */
export interface DrillContract {
  open: (panel: (context: DrillPanelContext) => UiComponent, title: string, pathSegment?: string) => void
}

/** What a host gives DrillDown; a workbench step context satisfies it, as can a lighter host. */
export type DrillHostContext = {
  registerDrillReturn: (control: DrillReturnControl | null) => void
  registerTrailingAction?: (action: (() => UiActionButtonProps | undefined) | null) => void
  registerDirty?: (check: () => boolean) => () => void
}

/** Host-owned command surface for returning from the active drill panel. */
export type DrillReturnControl = {
  path: () => readonly string[]
  returnTitle: () => string
  returnToIndex: () => void
}

/** Services for one draft panel; cover retains state, close releases it. */
export type DrillPanelContext = {
  isActive: () => boolean
  registerDirty: (check: () => boolean) => () => void
  registerSave: (action: () => UiActionButtonProps | undefined) => () => void
  returnToParent: () => void
}
