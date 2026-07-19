/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui form actions                                                              ║
║ Action button row, separate from the field grid.                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Groups action buttons at the end of a form. Always separate from the field
grid — never nested inside an UiField.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiFormActions  Action button row. Defaults to end-aligned; justify='split'
               pushes buttons to opposite ends.
*/

import type { UiComponent, UiContainerProps } from './ui-helpers.ts'

/** UiFormActions justify options. */
export type UiFormActionsJustify = 'end' | 'split'

/** UiFormActions props. */
export type UiFormActionsProps = UiContainerProps & {
  justify?: UiFormActionsJustify
}

/** Action button row. Always separate from the field grid. */
export const UiFormActions = (props: UiFormActionsProps): UiComponent => (
  <div data-ui='form-actions' data-ui-justify={props.justify}>{props.children}</div>
)
