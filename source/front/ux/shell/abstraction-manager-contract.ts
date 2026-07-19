/**
 * Generic abstraction manager provider contract.
 */

import type { Instance } from '@core/std'
import type {
  UiActionButtonIcon,
  UiActionButtonVariant,
  UiAlertVariant,
  UiComponent
} from '@front/ux/ui'

/** Feedback displayed in an abstraction manager editor header. */
export type AbstractionManagerFeedback = {
  message: string
  variant: UiAlertVariant
}

/** Confirmation copy for a consequential abstraction action. */
export type AbstractionActionConfirmation<T extends Instance> = {
  message: (item: T) => string
  title: string
}

/** A named action executable on an abstraction instance. */
export type AbstractionAction<T extends Instance> = {
  name: string
  label: string
  icon: UiActionButtonIcon
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
  editorFeedback?: () => AbstractionManagerFeedback | null
  cancel?: () => void
  actions: AbstractionAction<T>[]
  renderListCells: (item: T) => UiComponent
  renderForm: (item: T | null, onClose: () => void) => UiComponent
}
