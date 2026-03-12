/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Common domain adapter                                                        ║
║ Serialization for common topic abstractions.                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Serializes between Dictionary and common domain types. Exports toQuestion and
fromQuestion as primary public adapters. Also exports helpers for embedded
object types (Note, Attachment, Location, SelectOption, Answer) for use by
other adapter modules in the domain layer.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
toAttachment    Deserialize Attachment from a storage dictionary.
fromAttachment  Serialize Attachment to a storage dictionary.
toNote          Deserialize Note from a storage dictionary.
fromNote        Serialize Note to a storage dictionary.
toLocation      Deserialize Location from a storage dictionary.
fromLocation    Serialize Location to a storage dictionary.
toSelectOption  Deserialize SelectOption from a storage dictionary.
fromSelectOption  Serialize SelectOption to a storage dictionary.
toAnswer        Deserialize Answer from a storage dictionary.
fromAnswer      Serialize Answer to a storage dictionary.
toQuestion      Deserialize Question from a storage dictionary.
fromQuestion    Serialize Question to a storage dictionary.
*/

import type {
  AssociationOne,
  CompositionMany,
  CompositionPositive,
  Dictionary,
  Id,
  When
} from '@core/std'
import type {
  Answer,
  Attachment,
  AttachmentKind,
  InternalQuestion,
  Location,
  Note,
  NoteVisibility,
  Question,
  QuestionType,
  ScalarQuestion,
  SelectOption,
  SelectQuestion
} from '@domain/abstractions/common.ts'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC EXPORTS
// ────────────────────────────────────────────────────────────────────────────

/** Deserialize Attachment from a storage dictionary. */
export const toAttachment = (dict: Dictionary): Attachment => ({
  filename: dict.filename as string,
  url: dict.url as string,
  contentType: dict.content_type as string,
  kind: dict.kind as AttachmentKind,
  uploadedAt: dict.uploaded_at as When
})

/** Serialize Attachment to a storage dictionary. */
export const fromAttachment = (attachment: Attachment): Dictionary => ({
  filename: attachment.filename,
  url: attachment.url,
  content_type: attachment.contentType,
  kind: attachment.kind,
  uploaded_at: attachment.uploadedAt
})

/** Deserialize Note from a storage dictionary. */
export const toNote = (dict: Dictionary): Note => ({
  createdAt: dict.created_at as When,
  content: dict.content as string,
  visibility: dict.visibility as NoteVisibility,
  tags: dict.tags as CompositionMany<string>,
  attachments: (dict.attachments as Dictionary[]).map(toAttachment)
})

/** Serialize Note to a storage dictionary. */
export const fromNote = (note: Note): Dictionary => ({
  created_at: note.createdAt,
  content: note.content,
  visibility: note.visibility,
  tags: note.tags,
  attachments: note.attachments.map(fromAttachment)
})

/** Deserialize Location from a storage dictionary. */
export const toLocation = (dict: Dictionary): Location => ({
  latitude: dict.latitude as number,
  longitude: dict.longitude as number,
  altitudeMeters: dict.altitude_meters as number | undefined,
  line1: dict.line1 as string | undefined,
  line2: dict.line2 as string | undefined,
  city: dict.city as string | undefined,
  state: dict.state as string | undefined,
  postalCode: dict.postal_code as string | undefined,
  country: dict.country as string | undefined,
  recordedAt: dict.recorded_at as When | undefined,
  accuracyMeters: dict.accuracy_meters as number | undefined,
  description: dict.description as string | undefined
})

/** Serialize Location to a storage dictionary. */
export const fromLocation = (location: Location): Dictionary => ({
  latitude: location.latitude,
  longitude: location.longitude,
  altitude_meters: location.altitudeMeters,
  line1: location.line1,
  line2: location.line2,
  city: location.city,
  state: location.state,
  postal_code: location.postalCode,
  country: location.country,
  recorded_at: location.recordedAt,
  accuracy_meters: location.accuracyMeters,
  description: location.description
})

/** Deserialize SelectOption from a storage dictionary. */
export const toSelectOption = (dict: Dictionary): SelectOption => ({
  value: dict.value as string,
  label: dict.label as string | undefined,
  requiresNote: dict.requires_note as boolean | undefined
})

/** Serialize SelectOption to a storage dictionary. */
export const fromSelectOption = (option: SelectOption): Dictionary => ({
  value: option.value,
  label: option.label,
  requires_note: option.requiresNote
})

/** Deserialize Answer from a storage dictionary. */
export const toAnswer = (dict: Dictionary): Answer => ({
  questionId: dict.question_id as AssociationOne<Question>,
  value: dict.value as string | number | boolean | string[],
  capturedAt: dict.captured_at as When,
  notes: (dict.notes as Dictionary[]).map(toNote)
})

/** Serialize Answer to a storage dictionary. */
export const fromAnswer = (answer: Answer): Dictionary => ({
  question_id: answer.questionId,
  value: answer.value,
  captured_at: answer.capturedAt,
  notes: answer.notes.map(fromNote)
})

/** Deserialize Question from a storage dictionary. */
export const toQuestion = (dict: Dictionary): Question => {
  const type = dict.type as QuestionType
  switch (type) {
    case 'internal':
      return {
        id: dict.id as Id,
        createdAt: dict.created_at as When,
        updatedAt: dict.updated_at as When,
        deletedAt: dict.deleted_at as When | undefined,
        type,
        prompt: dict.prompt as string,
        helpText: dict.help_text as string | undefined,
        required: dict.required as boolean | undefined
      } satisfies InternalQuestion
    case 'text':
    case 'number':
    case 'boolean':
      return {
        id: dict.id as Id,
        createdAt: dict.created_at as When,
        updatedAt: dict.updated_at as When,
        deletedAt: dict.deleted_at as When | undefined,
        type,
        prompt: dict.prompt as string,
        helpText: dict.help_text as string | undefined,
        required: dict.required as boolean | undefined
      } satisfies ScalarQuestion
    case 'single-select':
    case 'multi-select':
      return {
        id: dict.id as Id,
        createdAt: dict.created_at as When,
        updatedAt: dict.updated_at as When,
        deletedAt: dict.deleted_at as When | undefined,
        type,
        prompt: dict.prompt as string,
        helpText: dict.help_text as string | undefined,
        required: dict.required as boolean | undefined,
        options: (dict.options as Dictionary[]).map(toSelectOption) as CompositionPositive<SelectOption>
      } satisfies SelectQuestion
  }
}

/** Serialize Question to a storage dictionary. */
export const fromQuestion = (question: Question): Dictionary => {
  switch (question.type) {
    case 'internal':
      return {
        id: question.id,
        created_at: question.createdAt,
        updated_at: question.updatedAt,
        deleted_at: question.deletedAt,
        type: question.type,
        prompt: question.prompt,
        help_text: question.helpText,
        required: question.required
      }
    case 'text':
    case 'number':
    case 'boolean':
      return {
        id: question.id,
        created_at: question.createdAt,
        updated_at: question.updatedAt,
        deleted_at: question.deletedAt,
        type: question.type,
        prompt: question.prompt,
        help_text: question.helpText,
        required: question.required
      }
    case 'single-select':
    case 'multi-select':
      return {
        id: question.id,
        created_at: question.createdAt,
        updated_at: question.updatedAt,
        deleted_at: question.deletedAt,
        type: question.type,
        prompt: question.prompt,
        help_text: question.helpText,
        required: question.required,
        options: question.options.map(fromSelectOption)
      }
  }
}
