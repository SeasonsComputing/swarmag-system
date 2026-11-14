/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder Library picker                                                  ║
║ Chooses one Library attachment: topic, then record, then document.           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
An Index-Detail over the Library's attachments, in a picker sheet: the Library
topics, a topic's records, and a record's documents from its notes. Choosing a
document hands back its name, a read of its bytes through Attachments that
reports download progress from the response body, and the record it came from.
The Binder keeps its own copy, so a record's attachment can change freely.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FieldBinderLibraryPickerProps  Picker inputs.
├ disabled                     The host is busy.
└ onChoose                     Receives the chosen document.
FieldBinderLibraryPicker       Choose-from-library button and sheet.
*/

import type { Id } from '@core/std'
import { listAll } from '@core/stdx'
import type { Attachment, Note } from '@domain/abstractions/common.ts'
import { api } from '@front/api/api.ts'
import { LIBRARY_TOPICS } from '@front/api/attachments.ts'
import type { LibraryTopic } from '@front/api/attachments.ts'
import type { UploadRead } from '@front/api/upload-task.ts'
import { createResource, For, Show } from '@solid-js'
import type { DrillContract } from '@ux/shell/panel/drill-contract.ts'
import { UiTable, UiTableBody, UiTableCell, UiTableHeader, UiTableRow, UiText } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { FieldBinderPicker, PickerDrillCell } from './field-binder-picker.tsx'

/** The host's busy state and the chosen document's receiver. */
export type FieldBinderLibraryPickerProps = {
  disabled: boolean
  onChoose: (name: string, read: UploadRead, record: { topic: LibraryTopic; id: Id }) => void
}

/** A picker sheet over the Library; choosing a document closes it. */
export const FieldBinderLibraryPicker = (props: FieldBinderLibraryPickerProps): UiComponent => (
  <FieldBinderPicker
    label='Choose from library'
    title='Library'
    disabled={props.disabled}
    root={(drill, close) => (
      <Topics
        drill={drill}
        choose={(topic, record, attachment) => {
          close()
          props.onChoose(
            attachment.filename,
            report => api.Attachments.file(attachment, report),
            { topic, id: record }
          )
        }}
      />
    )}
  />
)

// ────────────────────────────────────────────────────────────────────────────
// LIBRARY: TOPICS, RECORDS, DOCUMENTS
// ────────────────────────────────────────────────────────────────────────────

/** A Library record as the picker lists it: its id, label, and notes. */
type LibraryRecord = { id: Id; label: string; notes: readonly Note[] }

/** Receives a chosen document with its topic and record. */
type Choose = (topic: LibraryTopic, record: Id, attachment: Attachment) => void

/** The Library topics; activating one opens its records. */
const Topics = (props: { drill: DrillContract; choose: Choose }): UiComponent => (
  <UiTable>
    <UiTableHeader>
      <UiTableCell>Topic</UiTableCell>
      <UiTableCell />
    </UiTableHeader>
    <UiTableBody>
      <For each={LIBRARY_TOPICS}>
        {topic => (
          <UiTableRow
            onActivate={() =>
              props.drill.open(
                () => <Records topic={topic} drill={props.drill} choose={props.choose} />,
                topic
              )}
          >
            <UiTableCell>{topic}</UiTableCell>
            <PickerDrillCell />
          </UiTableRow>
        )}
      </For>
    </UiTableBody>
  </UiTable>
)

/** One topic's records; activating one opens its documents. */
const Records = (
  props: { topic: LibraryTopic; drill: DrillContract; choose: Choose }
): UiComponent => {
  const [records] = createResource(() => props.topic, loadRecords)
  return (
    <Show when={!records.loading} fallback={<p role='status'>Loading records…</p>}>
      <UiTable>
        <UiTableHeader>
          <UiTableCell>Record</UiTableCell>
          <UiTableCell />
        </UiTableHeader>
        <UiTableBody>
          <For each={records()} fallback={emptyRow('No records.')}>
            {record => (
              <UiTableRow
                onActivate={() =>
                  props.drill.open(
                    () => (
                      <Documents
                        record={record}
                        choose={attachment => props.choose(props.topic, record.id, attachment)}
                      />
                    ),
                    record.label
                  )}
              >
                <UiTableCell>{record.label}</UiTableCell>
                <PickerDrillCell />
              </UiTableRow>
            )}
          </For>
        </UiTableBody>
      </UiTable>
    </Show>
  )
}

/** One record's documents, from its notes; activating one chooses it. */
const Documents = (
  props: { record: LibraryRecord; choose: (attachment: Attachment) => void }
): UiComponent => (
  <UiTable>
    <UiTableHeader>
      <UiTableCell>Document</UiTableCell>
      <UiTableCell align='end'>Kind</UiTableCell>
    </UiTableHeader>
    <UiTableBody>
      <For
        each={props.record.notes.flatMap(note => note.attachments)}
        fallback={emptyRow('This record has no documents.')}
      >
        {attachment => (
          <UiTableRow onActivate={() => props.choose(attachment)}>
            <UiTableCell>{attachment.filename}</UiTableCell>
            <UiTableCell align='end'>{UiText.label(attachment.kind)}</UiTableCell>
          </UiTableRow>
        )}
      </For>
    </UiTableBody>
  </UiTable>
)

/** A read-only row that says a list is empty. */
const emptyRow = (message: string): UiComponent => (
  <UiTableRow>
    <UiTableCell>{message}</UiTableCell>
  </UiTableRow>
)

/** A topic's live records, labelled and ordered for choosing. */
const loadRecords = async (topic: LibraryTopic): Promise<readonly LibraryRecord[]> => {
  const records = await libraryRecords(topic)
  return records.toSorted((left, right) => left.label.localeCompare(right.label))
}

/** Each Library topic's records through its own API client. */
const libraryRecords = async (topic: LibraryTopic): Promise<LibraryRecord[]> => {
  switch (topic) {
    case 'Chemicals':
      return (await Array.fromAsync(listAll(api.Chemicals)))
        .map(record => ({ id: record.id, label: record.name, notes: record.notes }))
    case 'Assets':
      return (await Array.fromAsync(listAll(api.Assets)))
        .map(record => ({ id: record.id, label: record.label, notes: record.notes }))
    case 'Services':
      return (await Array.fromAsync(listAll(api.Services)))
        .map(record => ({ id: record.id, label: record.name, notes: record.notes }))
  }
}
