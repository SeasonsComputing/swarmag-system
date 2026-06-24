/**
 * Generic abstraction form provider contract.
 */

import type { Instance } from '@core/std'
import type { UiActionButtonIcon, UiActionButtonVariant, UiComponent } from '@ux/common/components/ui'

/** A named action executable on an abstraction instance. */
export type AbstractionAction<T extends Instance> = {
  name: string
  label: string
  icon: UiActionButtonIcon
  variant?: UiActionButtonVariant
  handler: (item: T) => void | Promise<void>
}

/** Provider contract for list-and-panel abstraction forms. */
export interface AbstractionFormContract<T extends Instance> {
  formTitle: string
  entityLabel: string
  listColumns: string[]
  list: () => T[]
  isListLoading: () => boolean
  actions: AbstractionAction<T>[]
  renderListCells: (item: T) => UiComponent
  renderForm: (item: T | null, onClose: () => void) => UiComponent
}
