/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui collection cursor                                                         ║
║ Cursor, position readout, and lifecycle controls for bounded collections.    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides collection position and lifecycle controls while the host owns the
collection and the item form.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiCollectionCursor  Cursor control for generic value-in/value-out collections.
*/

import { createMemo, createSignal, For, Show, untrack } from '@solid-js'
import { UiActionButton } from './ui-action-button.tsx'
import { UiButton } from './ui-button.tsx'
import { UiDialog } from './ui-dialog.tsx'
import { UiFormActions } from './ui-form-actions.tsx'
import type { UiComponent } from './ui-helpers.ts'
import { UiLayout } from './ui-layout.tsx'

/** Cursor surface over a bounded collection: position and lifecycle. */
export type UiCollectionCursorProps<T> = {
  /** The collection. Owned by the host; never mutated in place. */
  items: T[]
  /** Receives the next collection after New or Delete. */
  onItemsChange: (items: T[]) => void
  /** Produces a blank item for New. */
  newItem: () => T
  /** Renders the item at the cursor. */
  renderItem: (item: T, index: number) => UiComponent
  /** Shown when the collection is empty. */
  empty: { icon: string; message: string }
  /** Host-supplied copy for the delete confirmation. */
  confirmDelete: (item: T) => { title: string; message: string }
}

/** Pip slots rendered by the position readout before it falls back to `N of M`. */
const PIP_SLOTS = 8

/** Cursor control for generic value-in/value-out collections. */
export function UiCollectionCursor<T>(props: UiCollectionCursorProps<T>): UiComponent {
  const [cursor, setCursor] = createSignal(0)
  const [bodyRender, setBodyRender] = createSignal(0)
  const [deleteOpen, setDeleteOpen] = createSignal(false)
  let bodyElement: HTMLDivElement | undefined

  const count = () => props.items.length
  const hasItems = () => count() > 0
  const currentItem = (): T | undefined => props.items[cursor()]
  const currentDeleteCopy = () => {
    const item = currentItem()
    return item === undefined ? undefined : props.confirmDelete(item)
  }
  const pipState = (index: number): string => {
    if (hasItems() && index === cursor()) return 'selected'
    return index < count() ? 'present' : 'absent'
  }
  const moveCursor = (nextCursor: number): void => {
    setCursor(nextCursor)
    setBodyRender(value => value + 1)
  }
  const focusBodyFirstField = (): void => {
    queueMicrotask(() => {
      const field = bodyElement?.querySelector('input, textarea')
      if (field instanceof HTMLElement) field.focus()
    })
  }
  const addItem = (): void => {
    const nextItems = [...props.items, props.newItem()]
    props.onItemsChange(nextItems)
    moveCursor(nextItems.length - 1)
    focusBodyFirstField()
  }
  const deleteItem = (): void => {
    const index = cursor()
    const nextItems = props.items.filter((_, itemIndex) => itemIndex !== index)
    props.onItemsChange(nextItems)
    setDeleteOpen(false)
    setCursor(Math.min(index, nextItems.length - 1))
    setBodyRender(value => value + 1)
  }
  const body = createMemo(() => {
    bodyRender()
    const index = untrack(cursor)
    const item = untrack(() => props.items[index])
    return item === undefined ? undefined : props.renderItem(item, index)
  })

  return (
    <section data-ui='collection-cursor'>
      <UiFormActions justify='split'>
        <UiLayout variant='inline-fit' gap='tight'>
          <UiActionButton
            icon='chevron-left'
            label='Previous'
            density='dense'
            disabled={count() < 2 || cursor() <= 0}
            onClick={() => moveCursor(Math.max(0, cursor() - 1))}
          />
          <div
            aria-label={hasItems() ? `Item ${cursor() + 1} of ${count()}` : undefined}
            data-ui='collection-cursor-readout'
          >
            <Show
              when={count() > PIP_SLOTS}
              fallback={
                <For each={Array.from({ length: PIP_SLOTS })}>
                  {(_, index) => (
                    <span
                      aria-hidden='true'
                      data-ui='collection-cursor-pip'
                      data-ui-pip={pipState(index())}
                    />
                  )}
                </For>
              }
            >
              <span data-ui='collection-cursor-count'>{cursor() + 1} of {count()}</span>
            </Show>
          </div>
          <UiActionButton
            icon='chevron-right'
            label='Next'
            density='dense'
            disabled={count() < 2 || cursor() >= count() - 1}
            onClick={() => moveCursor(Math.min(count() - 1, cursor() + 1))}
          />
        </UiLayout>
        <UiLayout variant='inline-fit'>
          <UiActionButton
            icon='minus-circled'
            label='Delete'
            labelMode='visible'
            density='dense'
            variant='danger'
            disabled={!hasItems()}
            onClick={() => setDeleteOpen(true)}
          />
          <UiActionButton
            icon='plus-circled'
            label='New'
            labelMode='visible'
            density='dense'
            onClick={addItem}
          />
        </UiLayout>
      </UiFormActions>
      <div ref={bodyElement} data-ui='collection-cursor-body'>
        <Show
          when={hasItems()}
          fallback={
            <div data-ui='collection-cursor-empty'>
              <span
                aria-hidden='true'
                data-ui='collection-cursor-empty-icon'
                data-ui-icon={props.empty.icon}
              />
              <p data-ui='collection-cursor-empty-message'>{props.empty.message}</p>
            </div>
          }
        >
          {body()}
        </Show>
      </div>
      <UiDialog
        open={deleteOpen()}
        onOpenChange={setDeleteOpen}
        size='content'
        dismissible
      >
        <div data-ui='collection-cursor-confirm'>
          <h2 data-ui='collection-cursor-confirm-title'>{currentDeleteCopy()?.title}</h2>
          <p data-ui='collection-cursor-confirm-message'>{currentDeleteCopy()?.message}</p>
          <UiFormActions>
            <UiButton variant='ghost' onClick={() => setDeleteOpen(false)}>Cancel</UiButton>
            <UiButton variant='danger' disabled={!hasItems()} onClick={deleteItem}>Delete</UiButton>
          </UiFormActions>
        </div>
      </UiDialog>
    </section>
  )
}
