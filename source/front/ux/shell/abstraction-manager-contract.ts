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
AbstractionEditorHandle        Per-instance editor validation and draft surface.
AbstractionEditorContext       Manager-owned editor services exposed to a form.
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

/** Per-instance surface a mounted editor exposes to its manager. */
export type AbstractionEditorHandle<Draft> = {
  validate: () => boolean
  draft: () => Draft
}

/** Registers a mounted editor handle and returns its cleanup callback. */
export type AbstractionEditorRegistration<Draft> = (
  handle: AbstractionEditorHandle<Draft>
) => () => void

/** Manager-owned editor services exposed to a rendered editor form. */
export type AbstractionEditorContext<Draft> = {
  feedback: (feedback: PanelFeedback | null) => void
  register: AbstractionEditorRegistration<Draft>
  saving: () => boolean
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
  renderForm: (item: T | null, context: AbstractionEditorContext<Draft>) => UiComponent
}
