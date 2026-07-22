/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Abstraction manager contract                                                 ║
║ Provider contract for list-and-panel abstraction managers.                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Declares the provider contract a manager consumes: list projection, row and
form rendering, editor feedback, and named instance actions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AbstractionActionConfirmation  Confirmation copy for a consequential action.
AbstractionAction              A named action executable on an abstraction instance.
AbstractionManagerContract     Provider contract for list-and-panel managers.
*/

import type { Instance } from '@core/std'
import type { UiActionButtonVariant, UiComponent } from '@front/ux/ui'
import type { PanelFeedback } from './panel-contract.ts'

/** Confirmation copy for a consequential abstraction action. */
export type AbstractionActionConfirmation<T extends Instance> = {
  message: (item: T) => string
  title: string
}

/** A named action executable on an abstraction instance. */
export type AbstractionAction<T extends Instance> = {
  name: string
  label: string
  icon: string
  variant?: UiActionButtonVariant
  confirmation?: AbstractionActionConfirmation<T>
  handler: (item: T) => void | Promise<void>
}

/** Provider contract for list-and-panel abstraction managers. */
export interface AbstractionManagerContract<T extends Instance> {
  formTitle: string
  entityLabel: string
  listColumns: string[]
  list: () => T[]
  isListLoading: () => boolean
  editorFeedback?: () => PanelFeedback | null
  cancel?: () => void
  actions: AbstractionAction<T>[]
  renderListCells: (item: T) => UiComponent
  renderForm: (item: T | null, onClose: () => void) => UiComponent
}
