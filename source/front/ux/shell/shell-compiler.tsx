/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Shell compiler                                                               ║
║ TanStack route compilation for declared application shells.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Compiles declared application shells and shell routes into TanStack router
routes. Keeps route compilation separate from runtime bootstrap and shell
declaration factories.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
compileApplicationRoutes  Compile an application declaration into a route tree.
*/

import { UiDialog } from '@front/ux/ui'
import { onMount } from '@solid-js'
import {
  type AnyRoute,
  createRootRoute,
  createRoute,
  Navigate,
  useNavigate
} from '@tanstack/solid-router'
import type {
  Application,
  Shell,
  ShellDialog,
  ShellRoute,
  ShellTransition,
  ShellWorkbench
} from './shell.ts'

/** Compile an application declaration into a TanStack route tree. */
export const compileApplicationRoutes = (application: Application): AnyRoute => {
  const rootRoute = createRootRoute()
  return rootRoute.addChildren(
    application.shells.map((shell, index) => compileShell(rootRoute, shell, index))
  )
}

/** Compile one shell instance as a pathless TanStack layout route. */
const compileShell = (rootRoute: AnyRoute, shell: Shell, index: number): AnyRoute => {
  const ShellComponent = shell.component
  const shellRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: `shell-${index}`,
    component: () => <ShellComponent />
  })
  return shellRoute.addChildren(shell.routes.map(route => compileRoute(shellRoute, route)))
}

/** Compile one declared route beneath its owning shell layout route. */
const compileRoute = (parentRoute: AnyRoute, route: ShellRoute): AnyRoute => {
  switch (route.kind) {
    case 'dashboard': {
      return createRoute({
        getParentRoute: () => parentRoute,
        path: route.path,
        component: () => null
      })
    }
    case 'page': {
      const PageComponent = route.component
      return createRoute({
        getParentRoute: () => parentRoute,
        path: route.path,
        component: () => <PageComponent />
      })
    }
    case 'workbench': {
      return createRoute({
        getParentRoute: () => parentRoute,
        path: route.path,
        component: () => <ShellWorkbenchRoute workbench={route} />
      })
    }
    case 'dialog': {
      return createDialogRoute(parentRoute, route)
    }
    case 'redirect': {
      return createRoute({
        getParentRoute: () => parentRoute,
        path: route.path,
        component: () => <Navigate to={route.destination} />
      })
    }
    case 'transition': {
      return createRoute({
        getParentRoute: () => parentRoute,
        path: route.path,
        component: () => <ShellTransitionRoute transition={route} />
      })
    }
  }
}

/** Create a dialog route layered over the shell layout route. */
const createDialogRoute = (parentRoute: AnyRoute, dialog: ShellDialog): AnyRoute => {
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

/** Route component that supplies close navigation to a workbench. */
const ShellWorkbenchRoute = (props: { workbench: ShellWorkbench }) => {
  const navigate = useNavigate()
  const WorkbenchComponent = props.workbench.component
  const close = (): void => {
    void navigate({ to: '/' })
  }
  const onOpenChange = (open: boolean): void => {
    if (!open) close()
  }
  return (
    <UiDialog open size='workbench' onOpenChange={onOpenChange}>
      <WorkbenchComponent onCancel={close} />
    </UiDialog>
  )
}

/** Headless route component that runs a transition before navigating to its destination. */
const ShellTransitionRoute = (props: { transition: ShellTransition }) => {
  const navigate = useNavigate()
  onMount(() => void runShellTransition(props.transition, navigate))
  return null
}

/** Run transition work and always navigate to its declared destination. */
async function runShellTransition(
  transition: ShellTransition,
  navigate: ReturnType<typeof useNavigate>
): Promise<void> {
  try {
    await transition.run()
  } catch (e) {
    console.error('[shell-transition] transition failed', e)
  } finally {
    await navigate({ to: transition.destination, replace: true })
  }
}
