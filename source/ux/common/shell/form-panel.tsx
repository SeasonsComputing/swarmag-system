/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Form panel                                                                   ║
║ Adaptive form container — full-screen mobile, modal-centred desktop.         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
General-purpose form wrapper shared across all apps. Adapts layout to
viewport: full-screen on mobile, modal-centred on desktop.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FormPanel  Adaptive form container component.
*/

import type { UiComponent, UiContainerProps } from '@ux/common/components/ui'

/** FormPanel props. */
type FormPanelProps = UiContainerProps

/** Adaptive form container — full-screen on mobile, modal-centred on desktop. */
export const FormPanel = (props: FormPanelProps): UiComponent => (
  <div class='form-panel'>
    {props.children}
  </div>
)
