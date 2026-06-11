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

import { Match, Show, Switch } from '@solid-js'
import { Navigate } from '@tanstack/solid-router'
import type { UiComponent, UiContainerProps } from '@ux/common/components/ui'
import { SessionState } from '@ux/common/stores/session-state.ts'

export type AuthGuardProps = UiContainerProps

/** Route-level auth guard; redirects to /login when unauthenticated. */
export const AuthGuard = (props: AuthGuardProps): UiComponent => {
  const { store: session } = SessionState

  return (
    <Switch>
      <Match when={!session.isLoading && !session.isAuthenticated}>
        <Navigate to='/login' replace />
      </Match>
      <Match when={!session.isLoading && session.isAuthenticated}>
        <Show when={session.isAuthenticated}>
          {props.children}
        </Show>
      </Match>
    </Switch>
  )
}
