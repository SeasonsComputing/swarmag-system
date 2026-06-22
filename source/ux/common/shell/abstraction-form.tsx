/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Abstraction form                                                             ║
║ Generic list and dialog form shell driven by a provider contract.            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders an abstraction list and create dialog while delegating row and form
content to an abstraction-specific provider.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AbstractionForm  Generic list+dialog form component.
*/

import type { Instance } from '@core/std'
import { createSignal, For, Show } from '@solid-js'
import {
  UiCard,
  type UiComponent,
  UiDialog,
  UiLayout,
  UiTable,
  UiTableBody,
  UiTableCell,
  UiTableHeader,
  UiTableRow
} from '@ux/common/components/ui'
import type { AbstractionFormContract } from './abstraction-form-contract.ts'

/** Props for a generic abstraction form. */
export type AbstractionFormProps<T extends Instance> = {
  provider: AbstractionFormContract<T>
}

/** Generic abstraction list and create-dialog component. */
export const AbstractionForm = <T extends Instance>(props: AbstractionFormProps<T>): UiComponent => {
  const [open, setOpen] = createSignal(false)
  const close = (): void => {
    setOpen(false)
  }

  return (
    <section data-feat='abstraction-form'>
      <UiLayout>
        <UiLayout variant='inline-fill'>
          <h1>{props.provider.entityLabel}s</h1>
          <UiDialog
            trigger={`Add ${props.provider.entityLabel}`}
            triggerVariant='primary'
            open={open()}
            onOpenChange={setOpen}
          >
            {props.provider.renderForm(null, close)}
          </UiDialog>
        </UiLayout>

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
                    {item => props.provider.renderListRow(item)}
                  </For>
                </Show>
              </UiTableBody>
            </UiTable>
          </Show>
        </UiCard>
      </UiLayout>
    </section>
  )
}
