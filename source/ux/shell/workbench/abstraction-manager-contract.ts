/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Abstraction manager contract                                                 ║
║ Provider contract for list-and-panel abstraction managers.                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Declares the provider contract a manager consumes: list projection, row and
form rendering, persistence operations, and named instance actions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AbstractionActionConfirmation  Confirmation copy for a consequential action.
AbstractionAction              A named action executable on an abstraction instance.
AbstractionDetail              Steps and aggregate draft for one opened item.
AbstractionManagerContract     Provider contract for list-and-panel managers.
*/

import type { Instance } from '@core/std'
import type { PanelSequence } from '@ux/shell/panel/panel-sequence-contract.ts'
import type { UiActionButtonVariant, UiComponent } from '@ux/ui'

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

/** Steps and aggregate draft for one opened item. */
export type AbstractionDetail<Draft> = {
  steps: PanelSequence
  draft: () => Draft
}

/** Provider contract for list-and-panel abstraction managers. */
export interface AbstractionManagerContract<T extends Instance, Draft> {
  formTitle: string
  entityLabel: string
  listColumns: string[]
  list: () => T[]
  isListLoading: () => boolean
  itemLabel?: (item: T) => string
  refresh: () => void | Promise<void>
  create: (draft: Draft) => T | Promise<T>
  update: (item: T, draft: Draft) => T | Promise<T>
  actions: AbstractionAction<T>[]
  renderListCells: (item: T) => UiComponent
  detail: (item: T | null) => AbstractionDetail<Draft>
}
