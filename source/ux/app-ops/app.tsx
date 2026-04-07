/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ops app root                                                                 ║
║ Boot sequence, auth binding, and route tree for the Ops PWA.                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Initializes the Ops application. Registers the auth state listener, performs
the boot-time user fetch, loads the IDB job manifest, and mounts the TanStack
Router route tree. setDataReady is called only after jobsStore.isLoaded.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
(entry point — no exported symbols)
*/

import '@ux/config/ux-config.ts'
import { createEffect, onCleanup, onMount, Show } from '@solid-js'
import { render } from '@solid-js/web'
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
import { AppState } from '@ux/common/stores/app-state.ts'
import { SessionState } from '@ux/common/stores/session-state.ts'
import { Dashboard } from './dashboard/dashboard.tsx'
import { jobsStore, loadJobs } from './stores/jobs-store.ts'

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
        <Show when={SessionState.store.isDataReady} fallback={<p>Loading...</p>}>
          <Dashboard />
        </Show>
      </Content>
    </AuthGuard>
  )
})

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, dashboardRoute])
const router = createRouter({ routeTree })

// ────────────────────────────────────────────────────────────────────────────
// APPLICATION ROOT
// ────────────────────────────────────────────────────────────────────────────

/** Ops application root; wires auth state, job manifest, and mounts the router. */
const Application = () => {
  onMount(() => {
    const unsubscribe = api.Auth.onAuthStateChange(async session => {
      if (session) {
        SessionState.setAuth(session.userId)
        if (!SessionState.store.user) {
          const user = await api.Users.get(session.userId)
          SessionState.setUser(user)
          await loadJobs()
        }
      } else {
        SessionState.clear()
      }
    })
    onCleanup(unsubscribe)
  })

  createEffect(() => {
    if (jobsStore.isLoaded && SessionState.store.isAuthenticated && !SessionState.store.isDataReady) {
      SessionState.setReady()
    }
  })

  return <RouterProvider router={router} />
}

/** Register the Ops service worker for shell caching and offline support. */
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  void navigator.serviceWorker.register('/sw.js')
}

/** Initialize app state before mounting the Ops application. */
async function bootstrap() {
  await AppState.init()
  render(() => <Application />, document.getElementById('root')!)
  registerServiceWorker()
}

void bootstrap()
