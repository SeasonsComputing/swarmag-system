/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Manager selection example                                                    ║
║ In-memory workbench for persisted selection and callback failure review.     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Exercises ordinary management and caller-labelled selection without backend data.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ManagerExample  Interactive Manager selection specimen.
*/

import { instance } from '@core/std'
import type { Instance } from '@core/std'
import { createSignal, Show } from '@solid-js'
import type { ManagerContract } from '@ux/shell/workbench/manager-contract.ts'
import { Manager } from '@ux/shell/workbench/manager.tsx'
import { UiButton, UiCheckbox, UiDialog, UiField, UiInput, UiLayout } from '@ux/ui'
import type { UiComponent } from '@ux/ui'

/** Specimen Item and its editable value. */
type ExampleItem = Instance & { label: string }
type ExampleDraft = { label: string }

/** Interactive example with controllable callback rejection and delay. */
export const ManagerExample = (): UiComponent => {
  const [open, setOpen] = createSignal(false)
  const [choosing, setChoosing] = createSignal(true)
  const [reject, setReject] = createSignal(false)
  const [items, setItems] = createSignal<ExampleItem[]>([instance({ label: 'Saved question' })])
  const [result, setResult] = createSignal('No Item returned')
  const provider: ManagerContract<ExampleItem, ExampleDraft> = {
    formTitle: 'Example questions',
    entityLabel: 'Question',
    itemLabel: item => item.label,
    listColumns: [{ label: 'Label', render: item => item.label }],
    list: items,
    isListLoading: () => false,
    listError: () => null,
    refresh: () => {},
    actions: [],
    create: draft => {
      const created = instance<ExampleItem>(draft)
      setItems(current => [...current, created])
      return created
    },
    update: (item, draft) => {
      const updated = { ...item, ...draft }
      setItems(current => current.map(value => value.id === item.id ? updated : value))
      return updated
    },
    detail: item => {
      const [label, setLabel] = createSignal(item?.label ?? '')
      return {
        draft: () => ({ label: label() }),
        steps: [{
          name: 'detail',
          title: 'Question',
          validate: () => label().trim().length > 0,
          render: context => (
            <UiField for='manager-example-label' label='Question label'>
              <UiInput
                id='manager-example-label'
                name='label'
                value={label()}
                disabled={context.busy()}
                onInput={event => setLabel(event.currentTarget.value)}
              />
            </UiField>
          )
        }]
      }
    }
  }
  const onPick = async (item: ExampleItem): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    if (reject()) throw new Error('Example caller rejected the Item.')
    setResult(`Returned: ${item.label}`)
  }
  return (
    <UiLayout>
      <UiCheckbox checked={reject()} onChange={setReject}>Reject the returned Item</UiCheckbox>
      <UiButton
        onClick={() => {
          setChoosing(true)
          setOpen(true)
        }}
      >
        Open to Add
      </UiButton>
      <UiButton
        onClick={() => {
          setChoosing(false)
          setOpen(true)
        }}
      >
        Open to Manage
      </UiButton>
      <p role='status'>{result()}</p>
      <Show when={open()}>
        <UiDialog
          open
          label='Example questions'
          size={choosing() ? 'sheet' : 'workbench'}
          surface='frameless'
          dismissible={false}
        >
          <Manager
            provider={provider}
            onCancel={() => setOpen(false)}
            pick={choosing() ? { label: 'Add', onPick } : undefined}
          />
        </UiDialog>
      </Show>
    </UiLayout>
  )
}
