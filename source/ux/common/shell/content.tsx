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

import type { UiComponent, UiContainerProps } from '@ux/common/components/ui'

/** Props for the Content component. */
export type ContentProps = UiContainerProps

/** Main content frame for authenticated app views. */
export const Content = (props: UiContainerProps): UiComponent => (
  <main>
    {props.children}
  </main>
)
