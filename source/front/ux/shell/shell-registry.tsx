/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Shell                                                                        ║
║ Application shell makers.                                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PUBLIC
───────────────────────────────────────────────────────────────────────────────
anonymousShell   Creates a shell with no authentication required.
dashboardShell   Creates a dashboard shell with authentication required.
*/

import { DashboardState } from '@front/ux/stores/dashboard-state.ts'
import { type UiComponent, UiDialog } from '@front/ux/ui'
import type { WidgetRegistry } from '@front/ux/widgets/widget.tsx'
import { Outlet } from '@tanstack/solid-router'
import { type AnyRoute, createRoute, useNavigate } from '@tanstack/solid-router'
import { AboutBox } from './about-box.tsx'
import { AuthGuard } from './auth-guard.tsx'
import { DashboardProvider } from './dashboard-provider.tsx'
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

/** Create the lightweight shell and its common non-dashboard routes. */
export const anonymousShell = (): Shell => ({
  component: () => <Outlet />,
  initializers: [],
  routes: [
    page('/login', Login),
    transition('/logout', logout, '/login')
  ]
})

/** Create the authenticated dashboard shell from its entry path and runtime data. */
export const dashboardShell = (
  path: string,
  seed: unknown,
  widgets: WidgetRegistry,
  routes: ShellRoute[]
): Shell => {
  const DashboardShell = (): UiComponent => (
    <AuthGuard>
      <DashboardProvider state={DashboardState} widgets={widgets}>
        <main>
          <Dashboard />
          <Outlet />
        </main>
      </DashboardProvider>
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
export function dialogRoute(parentRoute: AnyRoute, dialog: ShellDialog): AnyRoute {
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
