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

import type { AppComponent, AppContainerProps } from './controls-helpers.ts'

/** AppFormActions props. */
export type AppFormActionsProps = AppContainerProps

/** Right-aligned action button row. Always separate from the field grid. */
export const AppFormActions = (props: AppFormActionsProps): AppComponent => (
  <div data-ui='form-actions'>{props.children}</div>
)
