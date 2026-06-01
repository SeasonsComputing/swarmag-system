/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App field                                                                    ║
║ Label + control wrapper using explicit for/id association.                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Canonical single-field wrapper. Renders a <label> and its control as siblings
inside a grid container. Label is always explicit (for/id) — never wraps a
control.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppField  Label + control field wrapper.
*/

import type { AppComponent, AppContainerProps } from './controls-helpers.ts'

/** AppField props. */
export type AppFieldProps = AppContainerProps & {
  /** Text content of the field label. */
  label: string
  /** ID of the associated control — wired to the label's `for` attribute. */
  for: string
  /** Optional layout variant. `'inline'` places label and control side-by-side. */
  variant?: 'inline'
}

/** Label + control field wrapper. Label and control are siblings, never nested. */
export const AppField = (props: AppFieldProps): AppComponent => (
  <div data-ui='field' data-ui-variant={props.variant}>
    <label for={props.for}>{props.label}</label>
    {props.children}
  </div>
)
