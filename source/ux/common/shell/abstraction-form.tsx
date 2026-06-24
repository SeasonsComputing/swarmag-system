/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Abstraction form                                                             ║
║ Generic list and panel form shell driven by a provider contract.             ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders an abstraction list and editor panel while delegating row and form
content to an abstraction-specific provider.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AbstractionForm  Generic list+panel form component.
*/

import type { Instance } from '@core/std'
import { createSignal, For, Show } from '@solid-js'
import {
  UiActionButton,
  UiButton,
  type UiComponent,
  UiFieldset,
  UiTable,
  UiTableBody,
  UiTableCell,
  UiTableHeader,
  UiTableRow
} from '@ux/common/components/ui'
import type { AbstractionFormContract } from './abstraction-form-contract.ts'

import './abstraction-form.css'

/** Props for a generic abstraction form. */
export type AbstractionFormProps<T extends Instance> = {
  provider: AbstractionFormContract<T>
}

type AbstractionFormMode = 'list' | 'editor'

/** Generic abstraction list and editor-panel component. */
export const AbstractionForm = <T extends Instance>(props: AbstractionFormProps<T>): UiComponent => {
  const [selected, setSelected] = createSignal<T | null>(null)
  const [mode, setMode] = createSignal<AbstractionFormMode>('list')
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

  return (
    <div data-feat='abstraction-form' data-feat-mode={mode()}>
      <h2 data-feat='abstraction-form-title'>{props.provider.formTitle}</h2>
      <section data-feat='abstraction-form-list'>
        <UiFieldset legend={`${props.provider.entityLabel}s`}>
          {/*<div data-feat='abstraction-form-list-actions'>
            <UiButton type='button' variant='secondary' onClick={onNew}>
              New {props.provider.entityLabel}
            </UiButton>
          </div>*/}
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
        </UiFieldset>
      </section>
      <section data-feat='abstraction-form-panel'>
        <div data-feat='abstraction-form-panel-actions'>
          <UiButton type='button' variant='ghost' onClick={() => setMode('list')}>
            {'<-'} {props.provider.entityLabel}s
          </UiButton>
        </div>
        <UiFieldset
          legend={selected()
            ? `Edit ${props.provider.entityLabel}`
            : `New ${props.provider.entityLabel}`}
        >
          {props.provider.renderForm(selected(), clearSelection)}
        </UiFieldset>
      </section>
    </div>
  )
}
