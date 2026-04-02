/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer app root                                                            ║
║ Boot sequence, auth binding, and route tree for the Customer portal.         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Initializes the Customer portal. Registers the auth state listener, performs
the boot-time user fetch, and mounts the TanStack Router route tree.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
(entry point — no exported symbols)
*/

import '@ux/config/ux-config.ts'
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
import { Dashboard } from '@ux/app-customer/dashboard/dashboard.tsx'
import { Login } from '@ux/common/components/login/login.tsx'
import { AuthGuard } from '@ux/common/components/shell/auth-guard.tsx'
import { Content } from '@ux/common/components/shell/content.tsx'
import { makeAppStateStore } from '@ux/common/lib/app-state.ts'
import { SessionState } from '@ux/common/lib/session-state.ts'

// ────────────────────────────────────────────────────────────────────────────
// APP STATE
// ────────────────────────────────────────────────────────────────────────────

const _appState = makeAppStateStore('swarmag-customer-app')

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
// ROOT
// ────────────────────────────────────────────────────────────────────────────

/** Customer application root; wires auth state and mounts the router. */
const App = () => {
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

render(() => <App />, document.getElementById('root')!)
