/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App fieldset                                                                 ║
║ Semantic group boundary for logically related form fields.                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Wraps <fieldset> + <legend>. The legend names the group — equivalent role to
<label> for an individual control. Assistive technology announces the legend
when focus enters the group.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppFieldset  Semantic field group wrapper with named legend.
*/

import type { AppComponent, AppContainerProps } from './ui-helpers.ts'

/** AppFieldset props. */
export type AppFieldsetProps = AppContainerProps & {
  /** Text content of the group legend — names the group, never wraps controls. */
  legend: string
}

/** Semantic field group with legend. Compose AppLayout inside for child layout. */
export const AppFieldset = (props: AppFieldsetProps): AppComponent => (
  <fieldset data-ui='fieldset'>
    <legend>{props.legend}</legend>
    {props.children}
  </fieldset>
)
