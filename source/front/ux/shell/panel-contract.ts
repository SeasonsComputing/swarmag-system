/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel contract                                                               ║
║ Prop shapes shared by the shell panel family.                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Declares the container, header, and feedback shapes shared by the panel family.
PanelContainer contributes chrome only — landmark structure, the feature CSS
namespace, and an optional mode attribute callers style against — while callers
supply the content of every panel. It stays neutral to what a surface presents:
the abstraction manager fills its two panels with a collection and an editor,
the wizard with a stepflow and a step form, and later surfaces may fill them
differently again. These are prop shapes, not provider contracts — nothing
implements them.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
PanelContainerProps  Slots for a panel container composition.
PanelHeaderProps     Leading and trailing content for a panel header.
PanelFeedback        Feedback shown beneath a form header.
*/

import type { UiAlertVariant, UiComponent } from '@front/ux/ui'

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
  main: UiComponent
  accessory?: UiComponent
  aside?: UiComponent
  mode?: string
  mainRef?: (element: HTMLElement) => void
}
