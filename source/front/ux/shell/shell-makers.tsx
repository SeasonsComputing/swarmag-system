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

import { DashboardState, DashboardStateSeed } from '@front/ux/stores/dashboard-state.ts'
import { type UiComponent } from '@front/ux/ui'
import { Outlet } from '@tanstack/solid-router'
import { AboutBox } from './about-box.tsx'
import { AuthGuard } from './auth-guard.tsx'
import { Dashboard } from './dashboard.tsx'
import { Login } from './login.tsx'
import { logout } from './logout.ts'
import { Routes, type Shell, type ShellRoute } from './shell.ts'
import { type WidgetRegistry } from './widget-contract.ts'

/** Create the lightweight shell and its common non-dashboard routes. */
export const makeAnonymousShell = (): Shell => ({
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
  routes: ShellRoute[]
): Shell => {
  const DashboardShell = (): UiComponent => (
    <AuthGuard>
      <main>
        <Dashboard state={DashboardState} widgets={widgets} />
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
