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

import { UiDialog, type UiDialogSize } from '@front/ux/ui'
import { onMount } from '@solid-js'
import {
  type AnyRoute,
  createRootRoute,
  createRoute,
  Navigate,
  useNavigate
} from '@tanstack/solid-router'
import type { Shell, ShellApplication, ShellOverlayView, ShellRoute, ShellTransition } from './shell.ts'

/** Compile an application declaration into a TanStack route tree. */
export const compileApplicationRoutes = (application: ShellApplication): AnyRoute => {
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
  return createRoute({
    getParentRoute: () => parentRoute,
    path: route.path,
    component: routeComponent(route)
  })
}

/** Compile one declared route to its route component. */
const routeComponent = (route: ShellRoute) => {
  switch (route.kind) {
    case 'index': {
      return () => null
    }
    case 'page': {
      const PageComponent = route.component
      return () => <PageComponent />
    }
    case 'overlay': {
      return () => (
        <ShellOverlayRoute
          component={route.component}
          dismissible={route.options.dismissible}
          size={route.options.size}
        />
      )
    }
    case 'redirect': {
      return () => <Navigate to={route.destination} />
    }
    case 'transition': {
      return () => <ShellTransitionRoute transition={route} />
    }
  }
}

/** Route component that supplies shared close navigation to shell overlays. */
const ShellOverlayRoute = (props: {
  component: ShellOverlayView
  dismissible: boolean
  size: UiDialogSize
}) => {
  const navigate = useNavigate()
  const OverlayComponent = props.component
  const close = (): void => {
    void navigate({ to: '/' })
  }
  const onOpenChange = (open: boolean): void => {
    if (!open) close()
  }
  return (
    <UiDialog
      open
      size={props.size}
      dismissible={props.dismissible}
      onOpenChange={onOpenChange}
    >
      <OverlayComponent onCancel={close} />
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
