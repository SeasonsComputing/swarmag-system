/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Shell navigate                                                               ║
║ Declarative shell navigation components.                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides route navigation components backed by the shell navigation contract.
Components use shell-owned navigation vocabulary rather than router-vendor APIs.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ShellNavigateProps  Properties for declarative shell navigation components.
ShellRedirect       Redirect to a route and preserve the current history entry.
ShellReplace        Redirect to a route and replace the current history entry.
*/

import { type UiComponent } from '@front/ux/ui'
import { onMount } from '@solid-js'
import { useShellNavigate } from './use-shell-navigate.ts'

/** Properties for declarative shell navigation components. */
export type ShellNavigateProps = {
  to: string
}

/** Redirect to a route and preserve the current history entry. */
export const ShellRedirect = (props: ShellNavigateProps): UiComponent => {
  const navigate = useShellNavigate()
  onMount(() => void navigate.redirect(props.to))
  return null
}

/** Redirect to a route and replace the current history entry. */
export const ShellReplace = (props: ShellNavigateProps): UiComponent => {
  const navigate = useShellNavigate()
  onMount(() => void navigate.replace(props.to))
  return null
}
