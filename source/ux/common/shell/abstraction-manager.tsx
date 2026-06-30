/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Abstraction manager                                                          ║
║ Generic list and panel manager shell driven by a provider contract.          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders an abstraction list and editor panel while delegating row and form
content to an abstraction-specific provider.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AbstractionManager  Generic list+panel manager component.
*/

import type { Instance } from '@core/std'
import { createSignal, For, Show } from '@solid-js'
import {
  UiActionButton,
  UiCard,
  type UiComponent,
  UiTable,
  UiTableBody,
  UiTableCell,
  UiTableHeader,
  UiTableRow
} from '@ux/common/components/ui'
import type { AbstractionManagerContract } from './abstraction-manager-contract.ts'

import './abstraction-manager.css'

/** Props for a generic abstraction manager. */
export type AbstractionManagerProps<T extends Instance> = {
  provider: AbstractionManagerContract<T>
}

type AbstractionManagerMode = 'list' | 'editor'

/** Generic abstraction list and editor-panel manager. */
export const AbstractionManager = <T extends Instance>(props: AbstractionManagerProps<T>): UiComponent => {
  const [selected, setSelected] = createSignal<T | null>(null)
  const [mode, setMode] = createSignal<AbstractionManagerMode>('list')
  const onSelect = (item: T): void => {
    setSelected(() => item)
    setMode('editor')
  }
  const onNew = (): void => {
    setSelected(null)
    setMode('editor')
  }
  const clearSelection = (): void => {
    setSelected(null)
    setMode('list')
  }
  const closeEditor = (): void => clearSelection()
  const cancelDialog = (): void => props.provider.cancel?.() ?? closeEditor()
  const editorTitle = (): string =>
    selected()
      ? `Edit ${props.provider.entityLabel}`
      : `New ${props.provider.entityLabel}`

  return (
    <div data-feat='abstraction-manager' data-feat-mode={mode()}>
      <header data-feat='abstraction-manager-title-row'>
        <h1 data-feat='abstraction-manager-title'>{props.provider.formTitle}</h1>
        <UiActionButton icon='cross' label='Cancel' labelMode='visible' onClick={cancelDialog} />
      </header>
      <section data-feat='abstraction-manager-list'>
        <UiCard elevation='raised'>
          <header data-feat='abstraction-manager-card-header'>
            <h2 data-feat='abstraction-manager-card-title'>{props.provider.entityLabel}s</h2>
            <div data-feat='abstraction-manager-card-actions'>
              <UiActionButton
                icon='plus'
                label={`New ${props.provider.entityLabel}`}
                labelMode='visible'
                onClick={onNew}
              />
            </div>
          </header>
          <div data-feat='abstraction-manager-card-body' data-feat-region='list-body'>
            <Show
              when={!props.provider.isListLoading()}
              fallback={<p>Loading {props.provider.entityLabel.toLowerCase()}s.</p>}
            >
              <UiTable overflow='scroll'>
                <UiTableHeader>
                  <For each={props.provider.listColumns}>
                    {column => <UiTableCell>{column}</UiTableCell>}
                  </For>
                  <UiTableCell align='end'>Actions</UiTableCell>
                </UiTableHeader>
                <UiTableBody>
                  <Show
                    when={props.provider.list().length > 0}
                    fallback={
                      <UiTableRow variant='section'>
                        <UiTableCell>
                          No {props.provider.entityLabel.toLowerCase()}s found.
                        </UiTableCell>
                      </UiTableRow>
                    }
                  >
                    <For each={props.provider.list()}>
                      {item => (
                        <UiTableRow onClick={() => onSelect(item)}>
                          {props.provider.renderListCells(item)}
                          <UiTableCell align='end'>
                            <For each={props.provider.actions}>
                              {action => (
                                <UiActionButton
                                  icon={action.icon}
                                  label={action.label}
                                  variant={action.variant}
                                  onClick={event => {
                                    event.stopPropagation()
                                    void action.handler(item)
                                  }}
                                />
                              )}
                            </For>
                            <UiActionButton icon='edit' label='Edit' onClick={() => onSelect(item)} />
                          </UiTableCell>
                        </UiTableRow>
                      )}
                    </For>
                  </Show>
                </UiTableBody>
              </UiTable>
            </Show>
          </div>
        </UiCard>
      </section>
      <section data-feat='abstraction-manager-panel'>
        <UiCard elevation='raised'>
          <header data-feat='abstraction-manager-card-header'>
            <div data-feat='abstraction-manager-card-title-group'>
              <div data-feat='abstraction-manager-collapse-action'>
                <span data-feat='abstraction-manager-back-command'>
                  <UiActionButton
                    icon='back'
                    label={`${props.provider.entityLabel}s`}
                    onClick={() => setMode('list')}
                  />
                  <span aria-hidden='true' data-feat='abstraction-manager-command-divider' />
                </span>
              </div>
              <h2 data-feat='abstraction-manager-card-title'>{editorTitle()}</h2>
            </div>
            <div data-feat='abstraction-manager-card-actions'>
              <UiActionButton
                icon='check'
                label='Save'
                labelMode='visible'
                type='submit'
                form='abstraction-panel-form'
              />
            </div>
          </header>
          <div data-feat='abstraction-manager-card-body' data-feat-region='editor-body'>
            {props.provider.renderForm(selected(), closeEditor)}
          </div>
        </UiCard>
      </section>
    </div>
  )
}
