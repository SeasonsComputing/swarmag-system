/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Notes editor                                                                 ║
║ Stock controlled notes collection and nested draft editor.                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Edits notes within a step-owned drill host without persisting. New notes remain
local until Save; existing timestamps and attachments survive content edits.
Save requires text or an attachment; either supplies the Note's content.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
NotesEditorProps    Controlled collection and drill host inputs.
├ notes             Current notes.
├ onChange          Replace notes in the parent draft.
├ drill             Existing Step drill host.
├ attach            Host-owned staging callback.
└ attachmentKinds   Optional accepted kinds.
NotesEditor       Render the notes Index-Detail pair.
*/

import { toTrimmed, when } from '@core/std'
import type { Attachment, AttachmentKind, Note } from '@domain/abstractions/common.ts'
import { isNote } from '@domain/validators/common-validator.ts'
import { createSignal, onCleanup, Show } from '@solid-js'
import { createStore } from '@solid-js/store'
import { CollectionPanel } from '@ux/shell/panel/collection-panel.tsx'
import type { DrillContract, DrillPanelContext } from '@ux/shell/panel/drill-contract.ts'
import { copyDraft, isDraftChanged } from '@ux/shell/workbench/workbench-draft.ts'
import {
  UiAlert,
  UiField,
  UiLayout,
  UiTab,
  UiTabList,
  UiTabPanel,
  UiTabs,
  UiText,
  UiTextArea
} from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { AttachmentList } from './attachment-list.tsx'
import { LabelCell } from './table-cells.tsx'

import './notes-editor.css'

/** Controlled notes collection; the containing step owns its drill host. */
export type NotesEditorProps = {
  notes: () => readonly Note[]
  onChange: (notes: readonly Note[]) => void
  drill: DrillContract
  attach: (file: File) => Promise<Attachment>
  attachmentKinds?: readonly AttachmentKind[]
}

/** Render stock note creation, editing, and confirmed removal. */
export const NotesEditor = (props: NotesEditorProps): UiComponent => {
  const [pendingNote, setPendingNote] = createSignal<Note | null>(null)
  const notes = (): readonly Note[] => {
    const pending = pendingNote()
    return pending ? [...props.notes(), pending] : props.notes()
  }
  return (
    <div data-app='notes-editor'>
      <CollectionPanel
        legend='Notes'
        itemColumn='Note'
        items={notes}
        label={noteTitle}
        renderLabel={note => (
          <LabelCell
            text={noteTitle(note)}
            icon={note.attachments.length ? 'link-2' : undefined}
            iconLabel={note.attachments.length ? 'Has attachments' : undefined}
          />
        )}
        emptyMessage={
          <>
            No notes yet. Use <kbd>New Note</kbd> to add one.
          </>
        }
        newLabel='New Note'
        onNew={() => setPendingNote({ attachments: [], createdAt: when(), content: '' })}
        onRemove={index => props.onChange(copyDraft(props.notes().filter((_, i) => i !== index)))}
        confirmRemove={() => ({ title: 'Delete note?', message: 'This note will be removed.' })}
        renderItem={(note, index, context) => {
          const isNew = index >= props.notes().length
          onCleanup(() => setPendingNote(null))
          return (
            <NotePanel
              note={note}
              attach={props.attach}
              attachmentKinds={props.attachmentKinds}
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
  attach: (file: File) => Promise<Attachment>
  attachmentKinds?: readonly AttachmentKind[]
  context: DrillPanelContext
  onSave: (note: Note) => void
}

const NotePanel = (props: NotePanelProps): UiComponent => {
  const original = { ...copyDraft(props.note), content: props.note.content ?? '' }
  const [draft, setDraft] = createStore(copyDraft(original))
  const [attaching, setAttaching] = createSignal(false)
  const [saveAttempted, setSaveAttempted] = createSignal(false)
  const hasContent = (): boolean => draft.content.trim().length > 0 || draft.attachments.length > 0
  const error = (): boolean => saveAttempted() && (!isNote(draft) || !hasContent())
  props.context.registerDirty(() => isDraftChanged(draft, original))
  const save = (): void => {
    if (!props.context.isActive() || attaching()) return
    setSaveAttempted(true)
    const note = { ...copyDraft(draft), content: UiText.optional(toTrimmed(draft.content)) }
    if (!isNote(note) || !hasContent()) return
    props.onSave(note)
    props.context.returnToParent()
  }
  props.context.registerSave(() => ({
    icon: 'check',
    label: 'Save',
    labelMode: 'visible',
    density: 'dense',
    error: error(),
    disabled: attaching(),
    onClick: save
  }))
  return (
    <UiLayout>
      <Show when={error()}>
        <UiAlert variant='danger'>Complete the note before saving.</UiAlert>
      </Show>
      <UiTabs defaultValue='note'>
        <UiTabList layout='between'>
          <UiTab value='note' disabled={attaching()}>Note</UiTab>
          <UiTab value='attachments' disabled={attaching()}>
            Attachments ({draft.attachments.length})
          </UiTab>
        </UiTabList>
        <UiTabPanel value='note'>
          <UiLayout>
            <UiLayout data-app='note-content' gap='none'>
              <time
                data-app='note-created-at'
                dateTime={draft.createdAt}
                title={new Date(draft.createdAt).toLocaleString()}
              >
                {UiText.relativeTime(draft.createdAt)}
              </time>
              <UiField for='note-content' label='Content' required={draft.attachments.length === 0}>
                <UiTextArea
                  name='note-content'
                  rows={6}
                  value={draft.content}
                  error={saveAttempted() && !hasContent()}
                  onInput={event => setDraft('content', event.currentTarget.value)}
                  required={draft.attachments.length === 0}
                />
              </UiField>
            </UiLayout>
          </UiLayout>
        </UiTabPanel>
        <UiTabPanel value='attachments'>
          <AttachmentList
            attachments={() => draft.attachments}
            onChange={attachments => setDraft('attachments', copyDraft(attachments))}
            attach={props.attach}
            kinds={props.attachmentKinds ?? ['photo', 'map', 'document']}
            busy={setAttaching}
          />
        </UiTabPanel>
      </UiTabs>
    </UiLayout>
  )
}

/** Summarize a note by its text, filename, or attachment count. */
const noteTitle = (note: Note): string => {
  const text = toTrimmed(note.content ?? '').split('\n')[0]
  if (text) return text
  if (note.attachments.length === 1) return note.attachments[0].filename
  if (note.attachments.length > 1) return `${note.attachments.length} attachments`
  return 'Untitled note'
}
