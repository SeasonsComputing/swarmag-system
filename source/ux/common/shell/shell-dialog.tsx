/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Shell dialog                                                                 ║
║ Route-owned dialog composition for application shell routes.                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Composes route dialogs through the shared UiDialog primitive.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ShellDialogComponent  Component contract for shell-owned dialog routes.
ShellDialogRoute      Dialog route registration shape.
makeDialogRoute       Create an authenticated dialog route.
*/

import { type AnyRoute, createRoute, useNavigate } from '@tanstack/solid-router'
import { type UiComponent, UiDialog, type UiDialogSize } from '@ux/common/components/ui'
import { AuthGuard } from './auth-guard.tsx'
import { Dashboard } from './dashboard.tsx'

/** Component contract for shell-owned dialog routes. */
export type ShellDialogComponent = (props: { onCancel: () => void }) => UiComponent

/** Dialog route registered by an app and layered by the shell. */
export type ShellDialogRoute = {
  path: string
  component: ShellDialogComponent
  dialog?: ShellDialogOptions
}

/** Shell dialog presentation options. */
export type ShellDialogOptions = {
  size?: UiDialogSize
  dismissible?: boolean
}

/**
 * Create an authenticated shell route that presents its component in a dialog.
 *
 * @param rootRoute Common shell root route.
 * @param dialog Dialog route registration.
 * @returns Route configured for controlled dialog presentation.
 */
export function makeDialogRoute(rootRoute: AnyRoute, dialog: ShellDialogRoute): AnyRoute {
  const DialogComponent = dialog.component
  return createRoute({
    getParentRoute: () => rootRoute,
    path: dialog.path,
    component: () => {
      const navigate = useNavigate()
      const close = (): void => {
        void navigate({ to: '/dashboard' })
      }
      const onOpenChange = (open: boolean): void => {
        if (!open) close()
      }

      return (
        <AuthGuard>
          <main>
            <Dashboard />
            <UiDialog
              open
              size={dialog.dialog?.size}
              dismissible={dialog.dialog?.dismissible}
              onOpenChange={onOpenChange}
            >
              <DialogComponent onCancel={close} />
            </UiDialog>
          </main>
        </AuthGuard>
      )
    }
  })
}
