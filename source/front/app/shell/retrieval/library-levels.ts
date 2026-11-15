/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Library levels                                                               ║
║ Topic, record, and document declarations shared by Library consumers.        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Reads Library records through the API and gives document activation its caller's
meaning. Record labels sort by locale; documents retain their notes' order.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
LibraryLevels  Shared Library navigation declarations.
└ root         Build levels with the caller's document action.
*/

import type { Id } from '@core/std'
import { listAll } from '@core/stdx'
import type { Attachment, Note } from '@domain/abstractions/common.ts'
import { api } from '@front/api/api.ts'
import { LIBRARY_TOPICS } from '@front/api/attachments.ts'
import type { LibraryTopic } from '@front/api/attachments.ts'
import { UiText } from '@ux/ui/components/ui-helpers.ts'
import type { DrillLevel } from './drill-navigator.tsx'

/** Shared navigation over Library topics, records, and documents. */
export const LibraryLevels = {
  root: (
    onDocument: (attachment: Attachment, record: { topic: LibraryTopic; id: Id }) => void
  ): DrillLevel => {
    const documents = (topic: LibraryTopic, record: LibraryRecord): DrillLevel => ({
      column: 'Document',
      detail: 'Kind',
      empty: 'This record has no documents.',
      load: () =>
        Promise.resolve(
          record.notes.flatMap(note => note.attachments).map(attachment => ({
            label: attachment.filename,
            detail: UiText.label(attachment.kind),
            choose: () => onDocument(attachment, { topic, id: record.id })
          }))
        )
    })

    const records = (topic: LibraryTopic): DrillLevel => ({
      column: TopicItems[topic],
      empty: `No ${topic.toLowerCase()}.`,
      load: async () =>
        (await loadRecords(topic)).map(record => ({
          label: record.label,
          open: () => documents(topic, record)
        }))
    })

    const topics: DrillLevel = {
      column: 'Topic',
      empty: 'No topics.',
      load: () =>
        Promise.resolve(LIBRARY_TOPICS.map(topic => ({ label: topic, open: () => records(topic) })))
    }

    return topics
  }
}

// ────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ────────────────────────────────────────────────────────────────────────────

/** What one record of each Library topic is called, as its column says. */
const TopicItems: { [Topic in LibraryTopic]: string } = {
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
