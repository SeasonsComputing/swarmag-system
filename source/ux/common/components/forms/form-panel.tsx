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

import type { JSX } from 'solid-js'

/** FormPanel props. */
type FormPanelProps = {
  children: JSX.Element
}

/** Adaptive form container — full-screen on mobile, modal-centred on desktop. */
export const FormPanel = (props: FormPanelProps) => (
  <div class='form-panel'>
    {props.children}
  </div>
)
