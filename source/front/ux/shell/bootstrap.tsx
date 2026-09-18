/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Bootstrap                                                                    ║
║ Application mounting, shell initialization, and session lifecycle entry.     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Boots a complete application composition. Shared bootstrap initializes global
runtime state, mounts Solid, and invokes the supplied session coordinator.
Applications own shell composition and session coordination.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
bootstrap  Mount a complete application.
*/

import { Config } from '@core/cfg/config.ts'
import { onMount } from '@solid-js'
import { render } from '@solid-js/web'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { createRouter, RouterProvider } from '@tanstack/solid-router'
import { AppState } from './app-state.ts'
import { compileApplicationRoutes } from './shell-compiler.tsx'
import type { ShellApplication } from './shell.ts'

import '@front/ux/ui/css/css.tsx'

// ────────────────────────────────────────────────────────────────────────────
// APPLICATION BOOTSTRAP
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
        application.session.init()
      })
      return (
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      )
    }

    // initialize and render the application
    await AppState.init()
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
// SERVICE WORKER
// ────────────────────────────────────────────────────────────────────────────

/** Register the application service worker for shell caching offline support. */
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
