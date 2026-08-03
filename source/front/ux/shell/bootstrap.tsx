/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Bootstrap                                                                    ║
║ Application mounting, shell initialization, and session synchronization.     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Boots a complete application composition. Shared bootstrap initializes global
runtime state, mounts Solid, and synchronizes the browser session. Applications
own shell composition.

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
import { onCleanup, onMount } from '@solid-js'
import { render } from '@solid-js/web'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { createRouter, RouterProvider } from '@tanstack/solid-router'
import { compileApplicationRoutes } from './shell-compiler.tsx'
import type { ShellApplication } from './shell.ts'

// ────────────────────────────────────────────────────────────────────────────
// 3. INSTALL LOOK & FEEL
// ────────────────────────────────────────────────────────────────────────────

import '@front/ux/ui/css/css.tsx'

// ────────────────────────────────────────────────────────────────────────────
// 4. BOOTSTRAP APPLICATION RUNTIME
// ────────────────────────────────────────────────────────────────────────────

/** Initialize a complete application composition and mount its router. */
export async function bootstrap(application: ShellApplication): Promise<void> {
  const showApplication = () => document.body.style.opacity = '1'
  try {
    const routeTree = compileApplicationRoutes(application)
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
// 5. SYNCHRONIZE SESSION
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
// 6. REGISTER SERVICE WORKER
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
