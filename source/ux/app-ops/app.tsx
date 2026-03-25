/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ops app root                                                                 ║
║ Boot sequence, auth binding, and route tree for the Ops PWA.                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Initialises the Ops application. Registers the auth state listener, performs
the boot-time user fetch, loads the IDB job manifest, and mounts the TanStack
Router route tree. setDataReady is called only after jobsStore.isLoaded.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
(entry point — no exported symbols)
*/

import '@ux/config/ux-config.ts'
import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  RouterProvider
} from '@tanstack/solid-router'
import { api } from '@ux/api'
import { Login } from '@ux/common/components/login/login.tsx'
import { AuthGuard } from '@ux/common/components/shell/auth-guard.tsx'
import { Content } from '@ux/common/components/shell/content.tsx'
import { makeAppStateStore } from '@ux/common/stores/app-state-store.ts'
import { SessionStore } from '@ux/common/stores/session-store.ts'
import { createEffect, onCleanup, onMount, Show } from 'solid-js'
import { render } from 'solid-js/web'
import { Dashboard } from './dashboard/dashboard.tsx'
import { jobsStore, loadJobs } from './stores/jobs-store.ts'

// ────────────────────────────────────────────────────────────────────────────
// APP STATE
// ────────────────────────────────────────────────────────────────────────────

const _appState = makeAppStateStore('swarmag-ops-app')

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
        <Show when={SessionStore.store.isDataReady} fallback={<p>Loading...</p>}>
          <Dashboard />
        </Show>
      </Content>
    </AuthGuard>
  )
})

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, dashboardRoute])
const router = createRouter({ routeTree })

// ────────────────────────────────────────────────────────────────────────────
// ROOT
// ────────────────────────────────────────────────────────────────────────────

/** Ops application root; wires auth state, job manifest, and mounts the router. */
const App = () => {
  onMount(() => {
    const unsubscribe = api.Auth.onAuthStateChange(async session => {
      if (session) {
        SessionStore.setAuth(session.userId)
        if (!SessionStore.store.user) {
          const user = await api.Users.get(session.userId)
          SessionStore.setUser(user)
          await loadJobs()
        }
      } else {
        SessionStore.clear()
      }
    })
    onCleanup(unsubscribe)
  })

  createEffect(() => {
    if (jobsStore.isLoaded && SessionStore.store.isAuthenticated && !SessionStore.store.isDataReady) {
      SessionStore.setReady()
    }
  })

  return <RouterProvider router={router} />
}

render(() => <App />, document.getElementById('root')!)
