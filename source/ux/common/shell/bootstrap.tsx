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
bootstrap() - Boots the application
*/

// ────────────────────────────────────────────────────────────────────────────
// 1. CONFIGURE APPLICATION
// ────────────────────────────────────────────────────────────────────────────

import { Config } from '@ux/config/ux-config.ts'

// ────────────────────────────────────────────────────────────────────────────
// 2. INSTALL SHELL
// ────────────────────────────────────────────────────────────────────────────

import type { Session } from '@core/api/api-auth-contract.ts'
import { onCleanup, onMount } from '@solid-js'
import { render } from '@solid-js/web'
import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  RouterProvider
} from '@tanstack/solid-router'
import { api } from '@ux/api'
import { AuthGuard } from './auth-guard.tsx'
import { Content } from './content.tsx'
import { Dashboard } from './dashboard.tsx'
import { Login } from './login.tsx'
import { buildShellContext } from './shell-config.ts'

// ────────────────────────────────────────────────────────────────────────────
// 3. INSTALL LOOK & FEEL
// ────────────────────────────────────────────────────────────────────────────

import '@ux/common/components/css/css.tsx'

// ────────────────────────────────────────────────────────────────────────────
// 4. DEFINE ROUTES
// ────────────────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute()

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to='/dashboard' />
})

const createLoginRoute = () => {
  const shell = buildShellContext()
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: () => <Login shell={shell} />
  })
}

const loginRoute = createLoginRoute()

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => (
    <AuthGuard>
      <Content>
        <Dashboard />
      </Content>
    </AuthGuard>
  )
})

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, dashboardRoute])
const router = createRouter({ routeTree })

// ────────────────────────────────────────────────────────────────────────────
// 5. BOOTSTRAP APPLICATION
// ────────────────────────────────────────────────────────────────────────────

const showApplication = () => document.body.style.opacity = '1'

/** Standard application root; wires auth state and mounts the router. */
const Application = () => {
  onMount(() => {
    showApplication()
    void syncSession()
    const unsubscribe = api.Auth.onAuthStateChange(session => void applySession(session))
    onCleanup(unsubscribe)
  })
  return <RouterProvider router={router} />
}

/** Initialize app state before mounting the application */
export async function bootstrap(dashboardSeed: unknown) {
  try {
    await api.AppState.init()
    await api.DashboardState.init(dashboardSeed)
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

  // authenticated, load user and preserve in session store,
  // then transition session to ready state.
  const user = await api.Users.get(session.userId)
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
