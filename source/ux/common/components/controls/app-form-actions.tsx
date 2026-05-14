/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App form actions                                                             ║
║ Right-aligned action button row, separate from the field grid.               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Groups action buttons at the end of a form. Always separate from the field
grid — never nested inside an AppField.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppFormActions  Right-aligned action row.
*/

import { type JSX } from '@solid-js'

/** AppFormActions props. */
export type AppFormActionsProps = {
  children: JSX.Element
}

/** Right-aligned action button row. Always separate from the field grid. */
export const AppFormActions = (props: AppFormActionsProps): JSX.Element => (
  <div data-ui='form-actions'>{props.children}</div>
)
