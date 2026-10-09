/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Notes editor                                                                 ║
║ Stock controlled notes collection and nested draft editor.                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Edits notes within a step-owned drill host without persisting. New notes remain
local until Save; existing timestamps and attachments survive content edits.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
NotesEditorProps  Controlled collection and drill host inputs.
NotesEditor       Render the notes Index-Detail pair.
*/

import { when } from '@core/std'
import { NOTE_VISIBILITIES } from '@domain/abstractions/common.ts'
import type { Note, NoteVisibility } from '@domain/abstractions/common.ts'
import { isNote } from '@domain/validators/common-validator.ts'
import { createSignal, For, onCleanup, Show } from '@solid-js'
import { createStore } from '@solid-js/store'
import { CollectionPanel } from '@ux/shell/panel/collection-panel.tsx'
import type { DrillContract, DrillPanelContext } from '@ux/shell/panel/drill-contract.ts'
import { copyDraft } from '@ux/shell/workbench/workbench-draft.ts'
import {
  UiAlert,
  UiField,
  UiFieldset,
  UiLayout,
  UiText,
  UiTextArea,
  UiToggleGroup,
  UiToggleItem
} from '@ux/ui'
import type { UiComponent } from '@ux/ui'

import './notes-editor.css'

/** Controlled notes collection; the containing step owns its drill host. */
export type NotesEditorProps = {
  notes: () => readonly Note[]
  onChange: (notes: readonly Note[]) => void
  drill: DrillContract
}

/** Render stock note creation, editing, and confirmed removal. */
export const NotesEditor = (props: NotesEditorProps): UiComponent => {
  const [pendingNote, setPendingNote] = createSignal<Note | null>(null)
  const notes = (): readonly Note[] => {
    const pending = pendingNote()
    return pending ? [...props.notes(), pending] : props.notes()
  }
  return (
    <div data-shell='notes-editor'>
      <CollectionPanel
        legend='Notes'
        itemColumn='Note'
        items={notes}
        label={note => UiText.untitled(note.content.split('\n')[0], 'Untitled note')}
        emptyMessage={
          <>
            No notes yet. Use <kbd>New Note</kbd> to add one.
          </>
        }
        newLabel='New Note'
        onNew={() =>
          setPendingNote({ attachments: [], createdAt: when(), content: '', visibility: 'internal' })}
        onRemove={index => props.onChange(copyDraft(props.notes().filter((_, i) => i !== index)))}
        confirmRemove={() => ({ title: 'Delete note?', message: 'This note will be removed.' })}
        renderItem={(note, index, context) => {
          const isNew = index >= props.notes().length
          onCleanup(() => setPendingNote(null))
          return (
            <NotePanel
              note={note}
              context={context}
              onSave={saved =>
                props.onChange(copyDraft(
                  isNew
                    ? [...props.notes(), saved]
                    : props.notes().map((item, i) => i === index ? saved : item)
                ))}
            />
          )
        }}
        drill={props.drill}
      />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// NOTE: DRAFT
// ────────────────────────────────────────────────────────────────────────────

/** Inputs for one opened note draft. */
type NotePanelProps = {
  note: Note
  context: DrillPanelContext
  onSave: (note: Note) => void
}

const NotePanel = (props: NotePanelProps): UiComponent => {
  const original = copyDraft(props.note)
  const [draft, setDraft] = createStore(copyDraft(props.note))
  const [saveAttempted, setSaveAttempted] = createSignal(false)
  const error = (): boolean => saveAttempted() && !isNote(draft)
  props.context.registerDirty(() => JSON.stringify(draft) !== JSON.stringify(original))
  const save = (): void => {
    if (!props.context.isActive()) return
    setSaveAttempted(true)
    if (!isNote(draft)) return
    props.onSave(copyDraft(draft))
    props.context.returnToParent()
  }
  props.context.registerSave(() => ({
    icon: 'check',
    label: 'Save',
    labelMode: 'visible',
    density: 'dense',
    error: error(),
    onClick: save
  }))
  return (
    <UiLayout>
      <Show when={error()}>
        <UiAlert variant='danger'>Complete the note before saving.</UiAlert>
      </Show>
      <UiFieldset legend='Note'>
        <UiLayout>
          <UiField for='note-content' label='Content' required>
            <UiTextArea
              name='note-content'
              rows={6}
              value={draft.content}
              error={saveAttempted() && draft.content.trim().length === 0}
              onInput={event => setDraft('content', event.currentTarget.value)}
              required
            />
          </UiField>
          <UiField label='Visibility' variant='caption'>
            <UiToggleGroup<NoteVisibility>
              value={draft.visibility}
              onChange={value => setDraft('visibility', value)}
            >
              <For each={NOTE_VISIBILITIES}>
                {value => <UiToggleItem value={value}>{UiText.label(value)}</UiToggleItem>}
              </For>
            </UiToggleGroup>
          </UiField>
        </UiLayout>
      </UiFieldset>
    </UiLayout>
  )
}
