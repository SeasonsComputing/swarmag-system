/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ bootstrap                                                                    ║
║ Boot sequence, auth binding, and route tree applications.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
App root features. Registers the auth state listener,
performs the boot-time user fetch, and mounts the TanStack Router route tree.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
bootstrap() - Boots the application
*/

// ────────────────────────────────────────────────────────────────────────────
// 1. CONFIGURE APPLICATION (FAST FAILS)
// ────────────────────────────────────────────────────────────────────────────

import '@ux/config/ux-config.ts'

// ────────────────────────────────────────────────────────────────────────────
// 2. INSTALL COMMON SHELL
// ────────────────────────────────────────────────────────────────────────────

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
// 5. BOOTSTRAP APPLICATION
// ────────────────────────────────────────────────────────────────────────────

/** Standard application root; wires auth state and mounts the router. */
const Application = () => {
  onMount(() => {
    document.body.style.opacity = '1'
    const unsubscribe = api.Auth.onAuthStateChange(async session => {
      if (session) {
        api.SessionState.setAuth(session.userId)
        if (!api.SessionState.store.user) {
          const user = await api.Users.get(session.userId)
          api.SessionState.setUser(user)
          api.SessionState.setReady()
        }
      } else {
        api.SessionState.clear()
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

/** Initialize app state before mounting the application */
export async function bootstrap(dashboardSeed: unknown) {
  try {
    await api.AppState.init()
    await api.DashboardState.init(dashboardSeed)
    render(() => <Application />, document.getElementById('root')!)
    registerServiceWorker()
  } catch (e) {
    document.body.style.opacity = '1'
    console.error('[bootstrap] startup failed', e)
    throw e
  }
}
