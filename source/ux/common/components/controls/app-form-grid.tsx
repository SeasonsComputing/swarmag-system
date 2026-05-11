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

import { type JSX } from '@solid-js'

/** AppFormGrid props. */
export type AppFormGridProps = {
  children: JSX.Element
}

/** Responsive auto-fit column layout for form fields. */
export const AppFormGrid = (props: AppFormGridProps): JSX.Element => (
  <div class='app-form-grid'>{props.children}</div>
)
