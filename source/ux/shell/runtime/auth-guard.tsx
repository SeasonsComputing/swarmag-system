/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Auth guard                                                                   ║
║ Route-level authentication enforcement.                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders children only after session preparation. Redirects to /login once
resolution finishes without authentication; renders nothing while preparing.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AuthGuard  Route-level auth guard component.
*/

import { Match, Switch } from '@solid-js'
import type { UiComponent, UiContainerProps } from '@ux/ui'
import { SessionState } from './session-state.ts'
import { ShellReplace } from './shell-navigate.tsx'

/* Authorization guard properties */
export type AuthGuardProps = UiContainerProps

/** Route-level auth guard; redirects to /login when unauthenticated. */
export const AuthGuard = (props: AuthGuardProps): UiComponent => {
  return (
    <Switch>
      <Match when={SessionState.isSignedOut()}>
        <ShellReplace to='/login' />
      </Match>
      <Match when={SessionState.isPrepared()}>{props.children}</Match>
    </Switch>
  )
}
