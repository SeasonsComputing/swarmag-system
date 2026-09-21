/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Shell makers                                                                 ║
║ Application shell and route factories.                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Creates the shared shell implementations and shell route declarations.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
makeAnonymousShell  Creates a shell with no authentication required.
makeDashboardShell  Creates a dashboard shell with authentication required.
*/

import { Outlet } from '@tanstack/solid-router'
import { DashboardState, type DashboardStateSeed } from '@ux/shell/dashboard/dashboard-state.ts'
import { Dashboard } from '@ux/shell/dashboard/dashboard.tsx'
import type { WidgetRegistry } from '@ux/shell/dashboard/widget-contract.ts'
import type { UiComponent } from '@ux/ui'
import { AuthGuard } from './auth-guard.tsx'
import { Routes } from './shell.ts'
import type { Shell, ShellOverlayView, ShellPageView, ShellRoute } from './shell.ts'

/** Create the lightweight shell and its common non-dashboard routes. */
export const makeAnonymousShell = (Login: ShellPageView, logout: () => Promise<void>): Shell => ({
  component: () => <Outlet />,
  initializers: [],
  routes: [
    Routes.page('/login', Login),
    Routes.transition('/logout', logout, '/login')
  ]
})

/** Create the authenticated dashboard shell from its entry path and runtime data. */
export const makeDashboardShell = (
  seed: DashboardStateSeed,
  widgets: WidgetRegistry,
  AboutBox: ShellOverlayView,
  Footer: () => UiComponent,
  routes: ShellRoute[]
): Shell => {
  const DashboardShell = (): UiComponent => (
    <AuthGuard>
      <main>
        <Dashboard state={DashboardState} widgets={widgets} footer={Footer} />
        <Outlet />
      </main>
    </AuthGuard>
  )
  return {
    component: DashboardShell,
    initializers: [() => DashboardState.init(seed)],
    routes: [
      Routes.index(),
      Routes.dialog('/about', AboutBox, { size: 'content', dismissible: true }),
      ...routes
    ]
  }
}
