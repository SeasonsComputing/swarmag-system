/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Auth guard                                                                   ║
║ Route-level authentication enforcement.                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders children only when the session is authenticated and the boot check
has completed. Redirects to /login when unauthenticated. Shows nothing
while isLoading is true to prevent a flash of unauthenticated content.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AuthGuard  Route-level auth guard component.
*/

import { createEffect, Show } from '@solid-js'
import type { JSX } from '@solid-js'
import { useNavigate } from '@tanstack/solid-router'
import { SessionState } from '@ux/common/stores/session-state.ts'

/** AuthGuard props. */
type AuthGuardProps = {
  children: JSX.Element
}

/** Route-level auth guard; redirects to /login when unauthenticated. */
export const AuthGuard = (props: AuthGuardProps) => {
  const navigate = useNavigate()
  const { store: session } = SessionState

  createEffect(() => {
    if (!session.isLoading && !session.isAuthenticated) {
      void navigate({ to: '/login', replace: true })
    }
  })

  return (
    <Show when={!session.isLoading && session.isAuthenticated}>
      {props.children}
    </Show>
  )
}
