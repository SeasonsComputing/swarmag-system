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

The grid layout must live inside AppFieldset via AppFormGrid, never on the
fieldset element itself. <fieldset> has quirky direct grid/flex container
behavior across browsers; the inner <div> from AppFormGrid is the reliable
layout host.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppFieldset  Semantic field group wrapper with named legend.
*/

import { type JSX } from '@solid-js'

/** AppFieldset props. */
export type AppFieldsetProps = {
  /** Text content of the group legend — names the group, never wraps controls. */
  legend: string
  children: JSX.Element
}

/** Semantic field group with legend. Compose AppFormGrid inside for field layout. */
export const AppFieldset = (props: AppFieldsetProps): JSX.Element => (
  <fieldset data-ui='fieldset'>
    <legend>{props.legend}</legend>
    {props.children}
  </fieldset>
)
