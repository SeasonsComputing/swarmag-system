/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Shell dialog                                                                 ║
║ Route-owned dialog composition for application shell routes.                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Composes route dialogs through the shared UiDialog primitive. Dialog routes are
children of the shell layout route, which owns the authenticated surface; a
dialog contributes only its overlay and never re-declares the surface beneath it.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ShellDialogComponent  Component contract for shell-owned dialog routes.
ShellDialog           Dialog route behavior compiled by the shared shell.
makeDialogRoute       Create an authenticated dialog route.
*/

import { type UiComponent, UiDialog, type UiDialogSize } from '@front/ux/ui'
import { type AnyRoute, createRoute, useNavigate } from '@tanstack/solid-router'
import type { ShellDialog } from './shell-route.ts'

/** Component contract for shell-owned dialog routes. */
export type ShellDialogComponent = (props: { onCancel: () => void }) => UiComponent

/** Shell dialog presentation options. */
export type ShellDialogOptions = {
  size: UiDialogSize
  dismissible: boolean
}

// ────────────────────────────────────────────────────────────────────────────
// MAKERS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Create a dialog route layered over the shell layout route.
 *
 * @param parentRoute Shell layout route owning the authenticated surface.
 * @param dialog Dialog route behavior.
 * @returns Route configured for controlled dialog presentation.
 */
export function makeDialogRoute(parentRoute: AnyRoute, dialog: ShellDialog): AnyRoute {
  const DialogComponent = dialog.component
  return createRoute({
    getParentRoute: () => parentRoute,
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
