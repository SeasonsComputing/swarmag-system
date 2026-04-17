/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App root                                                                     ║
║ Boot sequence, auth binding, and route tree applications.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
App root features. Registers the auth state listener,
performs the boot-time user fetch, and mounts the TanStack Router route tree.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
(entry point — no exported symbols)
*/

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
import { AuthGuard } from '@ux/common/components/shell/auth-guard.tsx'
import { AppState } from '@ux/common/stores/app-state.ts'
import { DashboardState } from '@ux/common/stores/dashboard-state.ts'
import { SessionState } from '@ux/common/stores/session-state.ts'
import { DashboardView } from '@ux/common/views/dashboard-views.ts'
import { Content } from './content.tsx'
import { Dashboard } from './dashboard.tsx'
import { Login } from './login.tsx'

// ────────────────────────────────────────────────────────────────────────────
// ROUTES
// ────────────────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute()

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to='/dashboard' />
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login
})

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
// APPLICATION ROOT
// ────────────────────────────────────────────────────────────────────────────

/** Admin application root; wires auth state and mounts the router. */
const Application = () => {
  onMount(() => {
    const unsubscribe = api.Auth.onAuthStateChange(async session => {
      if (session) {
        SessionState.setAuth(session.userId)
        if (!SessionState.store.user) {
          const user = await api.Users.get(session.userId)
          SessionState.setUser(user)
          SessionState.setReady()
        }
      } else {
        SessionState.clear()
      }
    })
    onCleanup(unsubscribe)
  })

  return <RouterProvider router={router} />
}

/** Register the Admin service worker for shell caching offline support. */
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  void navigator.serviceWorker.register('/sw.js')
}

/** Initialize app state before mounting the Admin appli*/
export async function bootstrap(dashboardSeed: unknown) {
  await AppState.init()
  await DashboardState.init(dashboardSeed)
  render(() => <Application />, document.getElementById('root')!)
  registerServiceWorker()
}
