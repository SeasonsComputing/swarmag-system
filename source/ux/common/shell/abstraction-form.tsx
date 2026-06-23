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
  UiCard,
  type UiComponent,
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

/** Generic abstraction list and editor-panel component. */
export const AbstractionForm = <T extends Instance>(props: AbstractionFormProps<T>): UiComponent => {
  const [selected, setSelected] = createSignal<T | null>(null)
  const onSelect = (item: T): void => {
    setSelected(() => item)
  }
  const clearSelection = (): void => {
    setSelected(null)
  }

  return (
    <section data-feat='abstraction-form'>
      <h2 data-feat='abstraction-form-title'>{props.provider.entityLabel}s</h2>
      <div data-feat='abstraction-form-list'>
        <UiCard variant='workflow'>
          <Show
            when={!props.provider.isListLoading()}
            fallback={<p>Loading {props.provider.entityLabel.toLowerCase()}s.</p>}
          >
            <UiTable overflow='scroll'>
              <UiTableHeader>
                <For each={props.provider.listColumns}>
                  {column => <UiTableCell>{column}</UiTableCell>}
                </For>
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
                    {item => props.provider.renderListRow(item, onSelect)}
                  </For>
                </Show>
              </UiTableBody>
            </UiTable>
          </Show>
        </UiCard>
      </div>

      <div data-feat='abstraction-form-panel'>
        {props.provider.renderForm(selected(), clearSelection)}
      </div>
    </section>
  )
}
