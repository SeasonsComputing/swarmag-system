/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Manager contract                                                             ║
║ Provider contract for list-and-panel managers.                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Declares the provider contract a manager consumes: list projection, row and
form rendering, persistence operations, and named instance actions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ManagerActionConfirmation  Confirmation copy for a consequential action.
├ message                  Item-specific confirmation message.
└ title                    Confirmation title.
ManagerCollectionAction    An action on the whole Collection.
├ name                     Action identity.
├ label                    Visible and accessible label.
├ icon                     Icon catalog name.
└ handler                  Performs the collection action.
ManagerAction              A named action executable on an item.
├ name                     Action identity.
├ label                    Accessible label.
├ icon                     Icon catalog name.
├ variant                  Optional action treatment.
├ confirmation             Optional confirmation copy.
└ handler                  Performs the item action.
ManagerListColumn          One labelled, aligned column and its item content.
├ label                    Column heading.
├ align                    Optional column alignment.
└ render                   Projects item content.
ManagerDetail              Steps and aggregate draft for one opened item.
├ steps                    Item editing sequence.
└ draft                    Reads the aggregate draft.
ManagerContract            Provider contract for list-and-panel managers.
├ formTitle                Workbench title.
├ entityLabel              Singular item kind.
├ listColumns              Collection column projections.
├ list                     Reads the collection.
├ isListLoading            Reports collection loading.
├ listError                Reports collection load failure.
├ itemLabel                Optional item display label.
├ refresh                  Reloads the collection.
├ create                   Creates an item from the draft.
├ update                   Updates an item from the draft.
├ actions                  Named item actions.
├ collectionActions        Optional actions beside New.
└ detail                   Opens an item's steps and draft.
*/

import type { Instance } from '@core/std'
import type { PanelSequence } from '@ux/shell/panel/panel-sequence-contract.ts'
import type { UiActionButtonVariant, UiComponent, UiTableAlign } from '@ux/ui'

/** Confirmation copy for a consequential item action. */
export type ManagerActionConfirmation<T extends Instance> = {
  message: (item: T) => string
  title: string
}

/** A named action executable on an item. */
export type ManagerAction<T extends Instance> = {
  name: string
  label: string
  icon: string
  variant?: UiActionButtonVariant
  confirmation?: ManagerActionConfirmation<T>
  handler: (item: T) => void | Promise<void>
}

/** Steps and aggregate draft for one opened item. */
export type ManagerDetail<Draft> = {
  steps: PanelSequence
  draft: () => Draft
}

/** One labelled, aligned list column and its item content. */
export type ManagerListColumn<T extends Instance> = {
  label: string
  align?: UiTableAlign
  render: (item: T) => UiComponent
}

/** Provider contract for list-and-panel managers. */
export interface ManagerContract<T extends Instance, Draft> {
  formTitle: string
  entityLabel: string
  listColumns: ManagerListColumn<T>[]
  list: () => T[]
  isListLoading: () => boolean
  listError: () => unknown
  itemLabel?: (item: T) => string
  refresh: () => void | Promise<void>
  create: (draft: Draft) => T | Promise<T>
  update: (item: T, draft: Draft) => T | Promise<T>
  actions: ManagerAction<T>[]
  collectionActions?: ManagerCollectionAction[]
  detail: (item: T | null) => ManagerDetail<Draft>
}

/** An action on the whole Collection, presented beside New. */
export type ManagerCollectionAction = {
  name: string
  label: string
  icon: string
  handler: () => void | Promise<void>
}
