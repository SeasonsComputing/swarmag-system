/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Dashboard provider                                                           ║
║ Dashboard runtime state and widget registry context.                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides the dashboard state contract and widget registry through one explicit
shell runtime boundary. Hosts widgets per the widget SPI: the registry is
app-supplied (composition root at bootstrap), and widget runtime context —
application identity — flows down through WidgetProvider.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DashboardProvider  Provides the dashboard runtime contract.
useDashboard       Reads the active dashboard runtime contract.
*/

import type { DashboardStateContract } from '@front/ux/stores/dashboard-state.ts'
import type { UiComponent } from '@front/ux/ui'
import { WidgetProvider, type WidgetRegistry } from '@front/ux/widgets/widget.tsx'
import { createContext, useContext } from '@solid-js'
import { getShellIdentity } from './shell-metadata.ts'

/** Dashboard runtime contract supplied to the shell subtree. */
export type DashboardContextContract = {
  state: DashboardStateContract
  widgets: WidgetRegistry
}

/** Context for the dashboard runtime contract supplied to the shell subtree. */
const DashboardContext = createContext<DashboardContextContract>()

/** Provides dashboard state and widget resolution to the shell subtree. */
export const DashboardProvider = (props: {
  state: DashboardStateContract
  widgets: WidgetRegistry
  children: UiComponent
}): UiComponent => (
  <DashboardContext.Provider value={{ state: props.state, widgets: props.widgets }}>
    <WidgetProvider identity={getShellIdentity()}>
      {props.children}
    </WidgetProvider>
  </DashboardContext.Provider>
)

/** Reads the active dashboard runtime contract. */
export const useDashboard = (): DashboardContextContract => {
  const dashboard = useContext(DashboardContext)
  if (!dashboard) throw new Error('useDashboard must be used within DashboardProvider')
  return dashboard
}
