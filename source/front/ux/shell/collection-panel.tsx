/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Collection panel                                                             ║
║ Shared bounded collection list panel for drill-down surfaces.                ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders a bounded collection frame with a table of activatable rows, a fixed
New action, an empty state, and mandatory confirmation for row removal.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CollectionPanelProps  Props for CollectionPanel.
CollectionPanel       Render a bounded collection list panel.
*/

import {
  UiActionButton,
  UiButton,
  type UiComponent,
  UiDialog,
  UiFieldset,
  UiFormActions,
  UiTable,
  UiTableBody,
  UiTableCell,
  UiTableHeader,
  UiTableRow
} from '@front/ux/ui'
import { createSignal, For, Show } from '@solid-js'
import type { DrillContract } from './drill-contract.ts'

import './collection-panel.css'

/** Props for the shared bounded collection list panel. */
export type CollectionPanelProps<T> = {
  legend: string
  itemColumn: string
  items: () => readonly T[]
  label: (item: T, index: number) => string
  emptyMessage: string
  newLabel: string
  onNew: () => void
  onRemove: (index: number) => void
  confirmRemove: (item: T, index: number) => { title: string; message: string }
  renderItem: (item: T, index: number) => UiComponent
  drill: DrillContract
}

/** Pending destructive row action copy captured when removal is requested. */
type PendingRemove<T> = {
  index: number
  title: string
  message: string
}

/** Renders a collection list panel whose rows open item panels through a drill host. */
export const CollectionPanel = <T extends unknown>(props: CollectionPanelProps<T>): UiComponent => {
  const [pendingRemove, setPendingRemove] = createSignal<PendingRemove<T> | null>(null)
  const openItem = (item: T, index: number): void => {
    props.drill.open(() => props.renderItem(item, index), props.label(item, index))
  }
  const addItem = (): void => {
    props.onNew()
    const index = props.items().length - 1
    openItem(props.items()[index], index)
  }
  const requestRemove = (item: T, index: number): void => {
    setPendingRemove({ index, ...props.confirmRemove(item, index) })
  }
  const confirmRemove = (): void => {
    const target = pendingRemove()
    if (!target) return
    props.onRemove(target.index)
    setPendingRemove(null)
  }

  return (
    <div data-shell='collection-panel'>
      <UiFieldset legend={props.legend}>
        <div data-shell='collection-panel-action'>
          <UiActionButton
            icon='plus'
            label={props.newLabel}
            labelMode='visible'
            onClick={addItem}
          />
        </div>
        <div data-shell='collection-panel-body'>
          <Show
            when={props.items().length > 0}
            fallback={<p data-shell='collection-panel-empty'>{props.emptyMessage}</p>}
          >
            <UiTable>
              <UiTableHeader>
                <UiTableCell>{props.itemColumn}</UiTableCell>
                <UiTableCell align='end'>Actions</UiTableCell>
              </UiTableHeader>
              <UiTableBody>
                <For each={props.items()}>
                  {(item, index) => (
                    <UiTableRow onActivate={() => openItem(item, index())}>
                      <UiTableCell>{props.label(item, index())}</UiTableCell>
                      <UiTableCell align='end'>
                        <UiActionButton
                          icon='trash'
                          label={`Delete ${props.label(item, index())}`}
                          variant='danger'
                          onClick={event => {
                            event.stopPropagation()
                            requestRemove(item, index())
                          }}
                        />
                      </UiTableCell>
                    </UiTableRow>
                  )}
                </For>
              </UiTableBody>
            </UiTable>
          </Show>
        </div>
      </UiFieldset>
      <Show when={pendingRemove()}>
        {target => (
          <UiDialog
            open
            size='content'
            onOpenChange={open => {
              if (!open) setPendingRemove(null)
            }}
          >
            <div data-shell='collection-panel-confirmation'>
              <h2>{target().title}</h2>
              <p>{target().message}</p>
              <UiFormActions>
                <UiButton variant='ghost' onClick={() => setPendingRemove(null)}>Cancel</UiButton>
                <UiButton variant='danger' onClick={confirmRemove}>Delete</UiButton>
              </UiFormActions>
            </div>
          </UiDialog>
        )}
      </Show>
    </div>
  )
}
