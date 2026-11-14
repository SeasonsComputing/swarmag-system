/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder Library picker                                                  ║
║ Chooses one Library attachment: topic, then record, then document.           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Declares three picker levels over the Library's attachments: the Library
topics, a topic's records, and a record's documents from its notes. Choosing a
document hands back its name, a read of its bytes through Attachments that
reports download progress from the response body, and the record it came from.
The Binder keeps its own copy, so a record's attachment can change freely.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FieldBinderLibraryPickerProps  Picker inputs.
├ disabled                     The host is busy.
├ name                         The form field the picker fills.
├ error                        The field is shown invalid.
└ onChoose                     Receives the chosen document.
FieldBinderLibraryPicker       Choose-from-library button and sheet.
*/

import type { Id } from '@core/std'
import { listAll } from '@core/stdx'
import type { Note } from '@domain/abstractions/common.ts'
import { api } from '@front/api/api.ts'
import { LIBRARY_TOPICS } from '@front/api/attachments.ts'
import type { LibraryTopic } from '@front/api/attachments.ts'
import type { UploadRead } from '@front/api/upload-task.ts'
import { UiText } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { FieldBinderPicker } from './field-binder-picker.tsx'
import type { PickerLevel } from './field-binder-picker.tsx'

/** The host's busy state and the chosen document's receiver. */
export type FieldBinderLibraryPickerProps = {
  disabled: boolean
  name: string
  error: boolean
  onChoose: (name: string, read: UploadRead, record: { topic: LibraryTopic; id: Id }) => void
}

/** A picker over the Library: topic, record, then document; choosing one closes it. */
export const FieldBinderLibraryPicker = (props: FieldBinderLibraryPickerProps): UiComponent => {
  const documents = (topic: LibraryTopic, record: LibraryRecord): PickerLevel => ({
    column: 'Document',
    detail: 'Kind',
    empty: 'This record has no documents.',
    load: () =>
      Promise.resolve(
        record.notes.flatMap(note => note.attachments).map(attachment => ({
          label: attachment.filename,
          detail: UiText.label(attachment.kind),
          choose: () =>
            props.onChoose(
              attachment.filename,
              report => api.Attachments.file(attachment, report),
              { topic, id: record.id }
            )
        }))
      )
  })

  const records = (topic: LibraryTopic): PickerLevel => ({
    column: TOPIC_ITEMS[topic],
    empty: `No ${topic.toLowerCase()}.`,
    load: async () =>
      (await loadRecords(topic)).map(record => ({
        label: record.label,
        open: () => documents(topic, record)
      }))
  })

  const topics: PickerLevel = {
    column: 'Topic',
    empty: 'No topics.',
    load: () =>
      Promise.resolve(LIBRARY_TOPICS.map(topic => ({ label: topic, open: () => records(topic) })))
  }

  return (
    <FieldBinderPicker
      label='Choose from library'
      title='Library'
      disabled={props.disabled}
      name={props.name}
      error={props.error}
      root={topics}
    />
  )
}

// ────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ────────────────────────────────────────────────────────────────────────────

/** What one record of each Library topic is called, as its column says. */
const TOPIC_ITEMS: { [Topic in LibraryTopic]: string } = {
  Assets: 'Asset',
  Chemicals: 'Chemical',
  Services: 'Service'
}

/** A Library record as the picker lists it: its id, label, and notes. */
type LibraryRecord = { id: Id; label: string; notes: readonly Note[] }

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
