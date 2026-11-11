/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Collection contract                                                          ║
║ Provider contract for a Collection and its column projections.               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Declares the Collection projection and loading contract shared by Manager and
Lister, independent of what activating an Item means.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CollectionListColumn  One labelled, aligned column and its item content.
├ label               Column heading.
├ align               Optional column alignment.
└ render              Projects item content.
CollectionContract    Provider contract for a Collection.
├ formTitle           Workbench title.
├ entityLabel         Singular item kind.
├ listColumns         Collection column projections.
├ list                Reads the collection.
├ isListLoading       Reports collection loading.
├ listError           Reports collection load failure.
└ refresh             Reloads the collection.
*/

import type { Instance } from '@core/std'
import type { UiComponent, UiTableAlign } from '@ux/ui'

/** One labelled, aligned list column and its item content. */
export type CollectionListColumn<T extends Instance> = {
  label: string
  align?: UiTableAlign
  render: (item: T) => UiComponent
}

/** Provider contract for a Collection: its projection and its loading. */
export interface CollectionContract<T extends Instance> {
  formTitle: string
  entityLabel: string
  listColumns: CollectionListColumn<T>[]
  list: () => T[]
  isListLoading: () => boolean
  listError: () => unknown
  refresh: () => void | Promise<void>
}
