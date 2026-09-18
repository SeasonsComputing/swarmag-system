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
import { type UiComponent, type UiContainerProps } from '@ux/ui'
import { SessionState } from './session-state.ts'
import { ShellReplace } from './shell-navigate.tsx'

/* Authorization guard properties */
export type AuthGuardProps = UiContainerProps

/** Route-level auth guard; redirects to /login when unauthenticated. */
export const AuthGuard = (props: AuthGuardProps): UiComponent => {
  const { store: session } = SessionState
  return (
    <Switch>
      <Match when={!session.isLoading && !session.isAuthenticated}>
        <ShellReplace to='/login' />
      </Match>
      <Match when={!session.isLoading && session.isAuthenticated}>
        <Show when={session.isAuthenticated}>
          {props.children}
        </Show>
      </Match>
    </Switch>
  )
}
