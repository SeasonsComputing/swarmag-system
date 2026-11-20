/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel close                                                                  ║
║ The window's own Close, placed among a panel header's trailing actions.      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders the one Close every panel-owned window shows: a dense, ringed icon with
its accessible label. The host supplies what Close does and when it is disabled.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
PanelCloseProps  Host-owned Close behavior.
├ onClick        Closes the window, after any host checks.
├ disabled       Disables Close while work is in flight.
└ data-shell     Optional shell styling hook.
PanelClose       The window's Close action.
*/

import { UiActionButton } from '@ux/ui'
import type { UiComponent } from '@ux/ui'

/** Host-owned Close behavior. */
export type PanelCloseProps = {
  onClick: () => void
  disabled?: boolean
  'data-shell'?: string
}

/** The window's Close action: a dense, ringed icon. */
export const PanelClose = (props: PanelCloseProps): UiComponent => (
  <UiActionButton
    data-shell={props['data-shell']}
    disabled={props.disabled}
    icon='cross-1'
    label='Close'
    labelMode='hidden'
    decoration='ring'
    density='dense'
    onClick={() => props.onClick()}
  />
)
