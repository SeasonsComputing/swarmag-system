/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Shell makers                                                                 ║
║ Application shell and route factories.                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Creates the shared shell implementations and compiles shell dialog declarations
into router routes.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
makeAnonymousShell  Creates a shell with no authentication required.
makeDashboardShell  Creates a dashboard shell with authentication required.
makeDialogRoute     Creates a router route for a shell dialog declaration.
*/

import { DashboardState } from '@front/ux/stores/dashboard-state.ts'
import { type UiComponent, UiDialog } from '@front/ux/ui'
import { Outlet } from '@tanstack/solid-router'
import { type AnyRoute, createRoute, useNavigate } from '@tanstack/solid-router'
import { AboutBox } from './about-box.tsx'
import { AuthGuard } from './auth-guard.tsx'
import { Dashboard } from './dashboard.tsx'
import { Login } from './login.tsx'
import { logout } from './logout.ts'
import {
  dashboard,
  dialog,
  page,
  type Shell,
  type ShellDialog,
  type ShellRoute,
  transition
} from './shell.ts'
import type { WidgetRegistry } from './widget-contract.ts'

/** Create the lightweight shell and its common non-dashboard routes. */
export const makeAnonymousShell = (): Shell => ({
  component: () => <Outlet />,
  initializers: [],
  routes: [
    page('/login', Login),
    transition('/logout', logout, '/login')
  ]
})

/** Create the authenticated dashboard shell from its entry path and runtime data. */
export const makeDashboardShell = (
  path: string,
  seed: unknown,
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
      dashboard(path),
      dialog('/about', AboutBox, { size: 'content', dismissible: true }),
      ...routes
    ]
  }
}

/** Create a dialog route layered over the shell layout route. */
export function makeDialogRoute(parentRoute: AnyRoute, dialog: ShellDialog): AnyRoute {
  const DialogComponent = dialog.component
  return createRoute({
    getParentRoute: () => parentRoute,
    path: dialog.path,
    component: () => {
      const navigate = useNavigate()
      const close = (): void => {
        void navigate({ to: '/' })
      }
      const onOpenChange = (open: boolean): void => {
        if (!open) close()
      }
      return (
        <UiDialog
          open
          size={dialog.options.size}
          dismissible={dialog.options.dismissible}
          onOpenChange={onOpenChange}
        >
          <DialogComponent onCancel={close} />
        </UiDialog>
      )
    }
  })
}
