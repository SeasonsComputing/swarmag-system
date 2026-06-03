/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui fieldset                                                                 ║
║ Semantic group boundary for logically related form fields.                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Wraps <fieldset> + <legend>. The legend names the group — equivalent role to
<label> for an individual control. Assistive technology announces the legend
when focus enters the group.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiFieldset  Semantic field group wrapper with named legend.
*/

import type { UiComponent, UiContainerProps } from './ui-helpers.ts'

/** UiFieldset props. */
export type UiFieldsetProps = UiContainerProps & {
  /** Text content of the group legend — names the group, never wraps controls. */
  legend: string
}

/** Semantic field group with legend. Compose UiLayout inside for child layout. */
export const UiFieldset = (props: UiFieldsetProps): UiComponent => (
  <fieldset data-ui='fieldset'>
    <legend>{props.legend}</legend>
    {props.children}
  </fieldset>
)
