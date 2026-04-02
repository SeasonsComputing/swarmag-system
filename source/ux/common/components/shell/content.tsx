/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Content                                                                      ║
║ Main content frame for the application shell.                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Wraps authenticated page content. Shared across all apps.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Content  Main content frame component.
*/

import type { JSX } from '@solid-js'

/** Content props. */
type ContentProps = {
  children: JSX.Element
}

/** Main content frame for authenticated app views. */
export const Content = (props: ContentProps) => (
  <main class='content'>
    {props.children}
  </main>
)
