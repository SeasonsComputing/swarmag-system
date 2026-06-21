/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Logout                                                                       ║
║ Route component for terminating the active auth session.                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Runs the logout sequence once on route mount, clears local session state, and
redirects to the login route.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Logout  Route component for logout.
*/

import { onMount } from '@solid-js'
import { useNavigate } from '@tanstack/solid-router'
import { api } from '@ux/api'

/** Route component for logout. */
export const Logout = () => {
  const navigate = useNavigate()
  onMount(() => void logoutAndRedirect(navigate))
  return null
}

/** Complete logout sequencing before leaving the route. */
async function logoutAndRedirect(navigate: ReturnType<typeof useNavigate>): Promise<void> {
  try {
    await api.Auth.logout()
  } catch (e) {
    console.error('[logout] logout failed', e)
  } finally {
    api.SessionState.clear()
    await navigate({ to: '/login', replace: true })
  }
}
