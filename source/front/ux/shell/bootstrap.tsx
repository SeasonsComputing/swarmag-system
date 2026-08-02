/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Bootstrap                                                                    ║
║ Application mounting, shell route compilation, and session synchronization.  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Boots a complete application composition. Shared bootstrap initializes global
runtime state, compiles declared shells into TanStack routes, mounts Solid, and
synchronizes the browser session. Applications own shell composition.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
bootstrap  Mount a complete application.
*/

// ────────────────────────────────────────────────────────────────────────────
// 1. CONFIGURE APPLICATION
// ────────────────────────────────────────────────────────────────────────────

import { Config } from '@front/config/ux-config.ts'

// ────────────────────────────────────────────────────────────────────────────
// 2. INSTALL SHELL
// ────────────────────────────────────────────────────────────────────────────

import type { Session } from '@core/api/api-auth-contract.ts'
import { api } from '@front/api'
import { UiDialog } from '@front/ux/ui'
import { onCleanup, onMount } from '@solid-js'
import { render } from '@solid-js/web'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import {
  type AnyRoute,
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  RouterProvider,
  useNavigate
} from '@tanstack/solid-router'
import { makeDialogRoute } from './shell-makers.tsx'
import type { Application, Shell, ShellRoute, ShellTransition, ShellWorkbench } from './shell.ts'

// ────────────────────────────────────────────────────────────────────────────
// 3. INSTALL LOOK & FEEL
// ────────────────────────────────────────────────────────────────────────────

import '@front/ux/ui/css/css.tsx'

// ────────────────────────────────────────────────────────────────────────────
// 4. COMPILE ROUTES
// ────────────────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute()

/** Compile one shell instance as a pathless TanStack layout route. */
const compileShell = (shell: Shell, index: number): AnyRoute => {
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
      return makeDialogRoute(parentRoute, route)
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

// ────────────────────────────────────────────────────────────────────────────
// 5. BOOTSTRAP APPLICATION RUNTIME
// ────────────────────────────────────────────────────────────────────────────

/** Initialize a complete application composition and mount its router. */
export async function bootstrap(application: Application): Promise<void> {
  const showApplication = () => document.body.style.opacity = '1'
  try {
    const routeTree = rootRoute.addChildren(
      application.shells.map((shell, index) => compileShell(shell, index))
    )
    const router = createRouter({ routeTree })
    const queryClient = new QueryClient()

    // application runtime singleton
    const ApplicationRuntime = () => {
      onMount(() => {
        showApplication()
        void syncSession()
        const unsubscribe = api.Auth.onAuthStateChange(session => void applySession(session))
        onCleanup(unsubscribe)
      })
      return (
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      )
    }

    // initialize and render the application
    await api.AppState.init()
    await Promise.all(
      application.shells.flatMap(
        shell => shell.initializers.map(initialize => initialize())
      )
    )
    render(() => <ApplicationRuntime />, document.getElementById('root')!)
    registerServiceWorker()
  } catch (e) {
    showApplication()
    console.error('[bootstrap] startup failed', e)
    throw e
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 6. SYNCHRONIZE SESSION
// ────────────────────────────────────────────────────────────────────────────

/** Resolve the persisted browser session at boot before route guards decide. */
async function syncSession(): Promise<void> {
  await applySession(await api.Auth.getSession())
}

/** Apply an auth session snapshot to shared UX session state. */
async function applySession(session: Session | null): Promise<void> {
  if (!session) {
    api.SessionState.clear()
    return
  }

  // authenticated, preserve id in session store
  api.SessionState.setAuth(session.userId)
  if (api.SessionState.store.user) return // user already loaded

  // authenticated, now load user, validate and preserve in session store,
  // then transition session to ready state.
  const user = await api.Users.get(session.userId)
  if (user.status !== 'active') {
    await api.Auth.logout()
    return
  }
  api.SessionState.setUser(user)
  api.SessionState.setReady()
}

// ────────────────────────────────────────────────────────────────────────────
// 7. REGISTER SERVICE WORKER
// ────────────────────────────────────────────────────────────────────────────

/** Register the Admin service worker for shell caching offline support. */
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('ServiceWorker is not supported in this browser.')
    return
  }
  if (!shouldRegisterServiceWorker()) {
    void unregisterServiceWorkers()
    return
  }
  void navigator.serviceWorker.register('/sw.js')
}

/** Check package-level service-worker registration policy. */
function shouldRegisterServiceWorker(): boolean {
  return Config.get('SERVICE_WORKER_ENABLED') === 'true'
}

/** Remove stale app workers when registration is disabled. */
async function unregisterServiceWorkers(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map(registration => registration.unregister()))
}
