/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel contract                                                               ║
║ Shared composition contracts for shell panel surfaces.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Declares the container, header, role, and feedback shapes shared by panel
compositions without imposing a provider contract on their callers.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
PanelContainerProps  Slots for a panel container composition.
PanelHeaderProps     Leading and trailing content for a panel header.
PanelRole            Named panel positions within a container.
PanelFeedback        Feedback shown beneath a form header.
*/

import type { UiAlertVariant, UiComponent } from '@front/ux/ui'

/** Named panel positions within a container. */
export type PanelRole = 'index' | 'subject'

/** Leading and trailing content for a panel header. */
export type PanelHeaderProps = {
  leading?: UiComponent
  trailing?: UiComponent
}

/** Feedback displayed beneath a panel form header. */
export type PanelFeedback = {
  message: string
  variant: UiAlertVariant
}

/** Slots for a panel container composition. */
export type PanelContainerProps = {
  feature: string
  header: UiComponent
  subject: UiComponent
  accessory?: UiComponent
  index?: UiComponent
  mode?: string
  subjectRef?: (element: HTMLElement) => void
}
