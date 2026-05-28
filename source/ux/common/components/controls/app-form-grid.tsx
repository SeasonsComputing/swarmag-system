/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App form grid                                                                ║
║ Responsive auto-fit column layout for form fields.                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Layout container for composing AppField instances into a responsive grid.
Layout only — no color, border, or typography.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppFormGrid  Responsive field grid container.
*/

import type { AppComponent, AppContainerProps } from './controls-helpers.ts'

/** AppFormGrid props. */
export type AppFormGridProps = AppContainerProps

/** Responsive auto-fit column layout for form fields. */
export const AppFormGrid = (props: AppFormGridProps): AppComponent => (
  <div data-ui='form-grid'>{props.children}</div>
)
