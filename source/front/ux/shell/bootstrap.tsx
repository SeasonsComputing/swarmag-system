/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ bootstrap                                                                    ║
║ Boot sequence, auth binding, and route tree applications.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
App root features. Registers the auth state listener,
performs the boot-time user fetch, and mounts the TanStack Router route tree.

1. CONFIGURE APPLICATION
2. INSTALL SHELL
3. INSTALL LOOK & FEEL
4. DEFINE ROUTES
5. BOOTSTRAP APPLICATION
6. SYNCHRONIZE SESSION
7. REGISTER SERVICE WORKER

PUBLIC
───────────────────────────────────────────────────────────────────────────────
bootstrap()       Boots the application.
BootstrapOptions  App-specific shell composition options.
├ dialogs         Shell-owned dialog route registrations.
├ routes          App-specific route registrations.
└ widgets         App-bound widget registry (the composition root).

rootRoute         Common route tree root.
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
import { DashboardState } from '@front/ux/stores/dashboard-state.ts'
import type { WidgetRegistry } from '@front/ux/widgets/widget.tsx'
import { onCleanup, onMount } from '@solid-js'
import { render } from '@solid-js/web'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import {
  type AnyRoute,
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  RouterProvider
} from '@tanstack/solid-router'
import { AboutBox } from './about-box.tsx'
import { AuthGuard } from './auth-guard.tsx'
import { DashboardProvider } from './dashboard-provider.tsx'
import { Dashboard } from './dashboard.tsx'
import { Login } from './login.tsx'
import { Logout } from './logout.tsx'
import { makeDialogRoute, type ShellDialogRoute } from './shell-dialog.tsx'

// ────────────────────────────────────────────────────────────────────────────
// 3. INSTALL LOOK & FEEL
// ────────────────────────────────────────────────────────────────────────────

import '@front/ux/ui/css/css.tsx'

// ────────────────────────────────────────────────────────────────────────────
// 4. DEFINE ROUTES
// ────────────────────────────────────────────────────────────────────────────

export const rootRoute = createRootRoute()

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to='/dashboard' />
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => <Login />
})

const logoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/logout',
  component: () => <Logout />
})

const aboutRoute = makeDialogRoute(rootRoute, {
  path: '/about',
  component: AboutBox,
  dialog: { size: 'content', dismissible: true }
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => (
    <AuthGuard>
      <main>
        <Dashboard />
      </main>
    </AuthGuard>
  )
})

// ────────────────────────────────────────────────────────────────────────────
// 5. BOOTSTRAP APPLICATION
// ────────────────────────────────────────────────────────────────────────────

/** Bootstrap options for app-specific shell composition. */
export type BootstrapOptions = {
  dialogs?: ShellDialogRoute[]
  routes?: AnyRoute[]
  widgets?: WidgetRegistry
}

/**
 * Initialize shell state, compose app routes, and mount the application.
 *
 * @param dashboardSeed Dashboard configuration seed for the app package.
 * @param options App-specific route and dialog registrations.
 */
export async function bootstrap(dashboardSeed: unknown, options: BootstrapOptions | AnyRoute[] = {}) {
  const showApplication = () => document.body.style.opacity = '1'
  try {
    const bootstrapOptions = Array.isArray(options) ? { routes: options } : options
    const routeTree = rootRoute.addChildren([
      indexRoute,
      loginRoute,
      logoutRoute,
      aboutRoute,
      dashboardRoute,
      ...(bootstrapOptions.dialogs ?? []).map(dialog => makeDialogRoute(rootRoute, dialog)),
      ...(bootstrapOptions.routes ?? [])
    ])
    const router = createRouter({ routeTree })
    const queryClient = new QueryClient()
    const Application = () => {
      onMount(() => {
        showApplication()
        void syncSession()
        const unsubscribe = api.Auth.onAuthStateChange(session => void applySession(session))
        onCleanup(unsubscribe)
      })
      return (
        <QueryClientProvider client={queryClient}>
          <DashboardProvider state={DashboardState} widgets={bootstrapOptions.widgets ?? {}}>
            <RouterProvider router={router} />
          </DashboardProvider>
        </QueryClientProvider>
      )
    }

    await api.AppState.init()
    await DashboardState.init(dashboardSeed)
    render(() => <Application />, document.getElementById('root')!)
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
