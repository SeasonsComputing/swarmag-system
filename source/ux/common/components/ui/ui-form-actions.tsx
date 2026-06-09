/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui form actions                                                              ║
║ Right-aligned action button row, separate from the field grid.               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Groups action buttons at the end of a form. Always separate from the field
grid — never nested inside an UiField.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiFormActions  Right-aligned action row.
*/

import type { UiComponent, UiContainerProps } from './ui-helpers.ts'

/** UiFormActions props. */
export type UiFormActionsProps = UiContainerProps

/** Right-aligned action button row. Always separate from the field grid. */
export const UiFormActions = (props: UiFormActionsProps): UiComponent => (
  <div data-ui='form-actions'>{props.children}</div>
)
