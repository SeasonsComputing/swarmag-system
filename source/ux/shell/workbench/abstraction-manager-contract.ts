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
AbstractionListColumn          One labelled, aligned column and its item content.
AbstractionDetail              Steps and aggregate draft for one opened item.
AbstractionManagerContract     Provider contract for list-and-panel managers.
*/

import type { Instantiable } from '@core/std'
import type { PanelSequence } from '@ux/shell/panel/panel-sequence-contract.ts'
import type { UiActionButtonVariant, UiComponent, UiTableAlign } from '@ux/ui'

/** Confirmation copy for a consequential abstraction action. */
export type AbstractionActionConfirmation<T extends Instantiable> = {
  message: (item: T) => string
  title: string
}

/** A named action executable on an abstraction instance. */
export type AbstractionAction<T extends Instantiable> = {
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

/** One labelled, aligned list column and its item content. */
export type AbstractionListColumn<T extends Instantiable> = {
  label: string
  align?: UiTableAlign
  render: (item: T) => UiComponent
}

/** Provider contract for list-and-panel abstraction managers. */
export interface AbstractionManagerContract<T extends Instantiable, Draft> {
  formTitle: string
  entityLabel: string
  listColumns: AbstractionListColumn<T>[]
  list: () => T[]
  isListLoading: () => boolean
  itemLabel?: (item: T) => string
  refresh: () => void | Promise<void>
  create: (draft: Draft) => T | Promise<T>
  update: (item: T, draft: Draft) => T | Promise<T>
  actions: AbstractionAction<T>[]
  detail: (item: T | null) => AbstractionDetail<Draft>
}
