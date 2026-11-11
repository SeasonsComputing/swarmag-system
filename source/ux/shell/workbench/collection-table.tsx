/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Collection table                                                             ║
║ Shared Collection presentation for Manager and Lister.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders the Collection heading, columns, rows, and loading, error, and empty
states. Hosts supply activation and optional heading and Item actions.
Imports the shared list styles so either workbench can load independently.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CollectionTableProps  Props for the shared Collection presentation.
├ provider            Collection projection and loading provider.
├ activate            Handles row activation.
├ headingActions      Optional controls beside the heading.
├ renderActions       Optional Actions column content for each Item.
└ error               Optional host action failure copy.
CollectionTable       Collection heading, feedback, and table.
*/

import type { Instance } from '@core/std'
import { For, Show } from '@solid-js'
import { PanelList } from '@ux/shell/panel/panel-list.tsx'
import { UiAlert, UiTable, UiTableBody, UiTableCell, UiTableHeader, UiTableRow } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import type { CollectionContract } from './collection-contract.ts'

import './collection-table.css'

/** Props for the shared Collection presentation. */
export type CollectionTableProps<T extends Instance> = {
  provider: CollectionContract<T>
  activate: (item: T) => void
  headingActions?: UiComponent
  renderActions?: (item: T) => UiComponent
  error?: string | null
}

/** Renders a Collection with host-owned activation and optional actions. */
export const CollectionTable = <T extends Instance>(props: CollectionTableProps<T>): UiComponent => {
  const listErrorMessage = (): string | null => {
    const error = props.provider.listError()
    if (error == null) return null
    return error instanceof Error ? error.message : `${props.provider.entityLabel}s failed to load.`
  }

  return (
    <PanelList
      header={{
        leading: <h2>{props.provider.entityLabel}s</h2>,
        trailing: props.headingActions
      }}
    >
      <Show when={props.error}>
        {message => <UiAlert variant='danger'>{message()}</UiAlert>}
      </Show>
      <Show when={listErrorMessage()}>
        {message => <UiAlert variant='danger'>{message()}</UiAlert>}
      </Show>
      <Show
        when={!props.provider.isListLoading()}
        fallback={<p>Loading {props.provider.entityLabel.toLowerCase()}s.</p>}
      >
        <div data-shell='collection-table'>
          <UiTable>
            <UiTableHeader>
              <For each={props.provider.listColumns}>
                {column => <UiTableCell align={column.align}>{column.label}</UiTableCell>}
              </For>
              <Show when={props.renderActions}>
                <UiTableCell align='end'>Actions</UiTableCell>
              </Show>
            </UiTableHeader>
            <UiTableBody>
              <Show
                when={props.provider.list().length > 0}
                fallback={
                  <UiTableRow variant='section'>
                    <UiTableCell>No {props.provider.entityLabel.toLowerCase()}s.</UiTableCell>
                  </UiTableRow>
                }
              >
                <For each={props.provider.list()}>
                  {item => (
                    <UiTableRow onActivate={() => props.activate(item)}>
                      <For each={props.provider.listColumns}>
                        {column => <UiTableCell align={column.align}>{column.render(item)}</UiTableCell>}
                      </For>
                      <Show when={props.renderActions}>
                        {render => <UiTableCell align='end'>{render()(item)}</UiTableCell>}
                      </Show>
                    </UiTableRow>
                  )}
                </For>
              </Show>
            </UiTableBody>
          </UiTable>
        </div>
      </Show>
    </PanelList>
  )
}
