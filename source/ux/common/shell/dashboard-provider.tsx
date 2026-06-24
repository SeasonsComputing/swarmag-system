/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Dashboard provider                                                           ║
║ Dashboard runtime state and widget registry context.                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides the dashboard state contract and widget registry through one explicit
shell runtime boundary.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DashboardProvider  Provides the dashboard runtime contract.
useDashboard       Reads the active dashboard runtime contract.
*/

import type { Dictionary } from '@core/std'
import { createContext, useContext } from '@solid-js'
import type { UiComponent } from '@ux/common/components/ui'
import type { DashboardStateContract } from '@ux/common/stores/dashboard-state.ts'

/** Dashboard widget component contract. */
export type WidgetComponent = (props: { settings: Dictionary }) => UiComponent

/** Dashboard widget registry keyed by dashboard widget type string. */
export type WidgetRegistry = Dictionary<WidgetComponent>

/** Dashboard runtime contract supplied to the shell subtree. */
export type DashboardContextContract = {
  state: DashboardStateContract
  widgets: WidgetRegistry
}

const DashboardContext = createContext<DashboardContextContract>()

/** Provides dashboard state and widget resolution to the shell subtree. */
export const DashboardProvider = (props: {
  state: DashboardStateContract
  widgets: WidgetRegistry
  children: UiComponent
}): UiComponent => (
  <DashboardContext.Provider value={{ state: props.state, widgets: props.widgets }}>
    {props.children}
  </DashboardContext.Provider>
)

/** Reads the active dashboard runtime contract. */
export const useDashboard = (): DashboardContextContract => {
  const dashboard = useContext(DashboardContext)
  if (!dashboard) throw new Error('useDashboard must be used within DashboardProvider')
  return dashboard
}
