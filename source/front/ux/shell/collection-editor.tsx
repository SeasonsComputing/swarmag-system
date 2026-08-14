/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Collection editor                                                            ║
║ Shared list/edit shell for bounded editable collections.                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides a reusable collection surface with add, select, remove, empty-state,
and an inline editor region. Selection is local and ephemeral.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CollectionEditor       Render a bounded collection list with selected editor.
CollectionEditorProps  Props for CollectionEditor.
*/

import { UiActionButton, UiButton, type UiComponent, UiFieldset, UiList, UiListItem } from '@front/ux/ui'
import { createSignal, For, Show } from '@solid-js'

import './collection-editor.css'

/** Props for the shared bounded collection editor shell. */
export type CollectionEditorProps<T> = {
  legend: string
  items: () => readonly T[]
  label: (item: T, index: number) => string
  emptyMessage: string
  newLabel: string
  onNew: () => void
  onRemove: (index: number) => void
  renderEditor: (item: T, index: number) => UiComponent
}

/**
 * Renders a bounded collection editor with local ephemeral selection.
 *
 * @param props Collection data, labels, mutation intents, and editor renderer.
 * @returns Shared shell collection editor component.
 */
export function CollectionEditor<T>(props: CollectionEditorProps<T>): UiComponent {
  const [selected, setSelected] = createSignal<number | null>(null)
  const remove = (index: number): void => {
    props.onRemove(index)
    setSelected(null)
  }
  const editor = (): UiComponent => {
    const index = selected()
    if (index === null) return null
    const item = props.items()[index]
    if (!item) return null
    return <div data-shell='collection-editor-editor'>{props.renderEditor(item, index)}</div>
  }

  return (
    <div data-shell='collection-editor'>
      <UiFieldset legend={props.legend}>
        <div data-shell='collection-editor-actions'>
          <UiActionButton
            icon='plus'
            label={props.newLabel}
            labelMode='visible'
            onClick={props.onNew}
          />
        </div>
        <Show
          when={props.items().length > 0}
          fallback={<p data-shell='collection-editor-empty'>{props.emptyMessage}</p>}
        >
          <UiList>
            <For each={props.items()}>
              {(item, index) => {
                const label = (): string => props.label(item, index())
                const deleteLabel = (): string => `Delete ${label().trim() || 'item'}`
                return (
                  <CollectionEditorRow
                    label={label()}
                    selected={selected() === index()}
                    deleteLabel={deleteLabel()}
                    onSelect={() => setSelected(index())}
                    onRemove={() => remove(index())}
                  />
                )
              }}
            </For>
          </UiList>
        </Show>
        {editor()}
      </UiFieldset>
    </div>
  )
}

/** Props for one selectable collection editor row. */
type CollectionEditorRowProps = {
  label: string
  selected: boolean
  deleteLabel: string
  onSelect: () => void
  onRemove: () => void
}

/** Selectable collection row with a separate remove action. */
const CollectionEditorRow = (props: CollectionEditorRowProps): UiComponent => (
  <UiListItem>
    <div data-shell='collection-editor-row' data-shell-selected={props.selected ? '' : undefined}>
      <UiButton
        aria-current={props.selected ? 'true' : undefined}
        variant='ghost'
        onClick={props.onSelect}
      >
        <span
          data-shell='collection-editor-row-label'
          data-shell-empty={props.label.trim() ? undefined : ''}
        >
          {props.label.trim() || 'Empty item'}
        </span>
      </UiButton>
      <UiActionButton
        icon='trash'
        label={props.deleteLabel}
        variant='danger'
        onClick={props.onRemove}
      />
    </div>
  </UiListItem>
)
