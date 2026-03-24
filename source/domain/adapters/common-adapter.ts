/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Common domain adapters                                                       ║
║ Dictionary serialization for common topic abstractions.                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Maps storage dictionaries to common abstractions and back.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toLocation(dict)            Deserialize Location from dictionary.
fromLocation(location)      Serialize Location to dictionary.
toAttachment(dict)          Deserialize Attachment from dictionary.
fromAttachment(attachment)  Serialize Attachment to dictionary.
toNote(dict)                Deserialize Note from dictionary.
fromNote(note)              Serialize Note to dictionary.
toSelectOption(dict)        Deserialize SelectOption from dictionary.
fromSelectOption(option)    Serialize SelectOption to dictionary.
toQuestion(dict)            Deserialize Question from dictionary.
fromQuestion(question)      Serialize Question to dictionary.
toAnswer(dict)              Deserialize Answer from dictionary.
fromAnswer(answer)          Serialize Answer to dictionary.
*/

import type { Dictionary } from '@core/std'
import type {
  Answer,
  Attachment,
  InternalQuestion,
  Location,
  Note,
  Question,
  QuestionType,
  ScalarQuestion,
  SelectOption,
  SelectQuestion
} from '@domain/abstractions/common.ts'

/** Deserialize Location from dictionary. */
export const toLocation = (dict: Dictionary): Location => ({
  latitude: dict.latitude as number,
  longitude: dict.longitude as number,
  altitudeMeters: dict.altitude_meters as number | undefined,
  line1: dict.line_1 as string | undefined,
  line2: dict.line_2 as string | undefined,
  city: dict.city as string | undefined,
  state: dict.state as string | undefined,
  postalCode: dict.postal_code as string | undefined,
  country: dict.country as string | undefined,
  recordedAt: dict.recorded_at as string | undefined,
  accuracyMeters: dict.accuracy_meters as number | undefined,
  description: dict.description as string | undefined
})

/** Serialize Location to dictionary. */
export const fromLocation = (location: Location): Dictionary => ({
  latitude: location.latitude,
  longitude: location.longitude,
  altitude_meters: location.altitudeMeters,
  line_1: location.line1,
  line_2: location.line2,
  city: location.city,
  state: location.state,
  postal_code: location.postalCode,
  country: location.country,
  recorded_at: location.recordedAt,
  accuracy_meters: location.accuracyMeters,
  description: location.description
})

/** Deserialize Attachment from dictionary. */
export const toAttachment = (dict: Dictionary): Attachment => ({
  filename: dict.filename as string,
  url: dict.url as string,
  contentType: dict.content_type as string,
  kind: dict.kind as Attachment['kind'],
  uploadedAt: dict.uploaded_at as string
})

/** Serialize Attachment to dictionary. */
export const fromAttachment = (attachment: Attachment): Dictionary => ({
  filename: attachment.filename,
  url: attachment.url,
  content_type: attachment.contentType,
  kind: attachment.kind,
  uploaded_at: attachment.uploadedAt
})

/** Deserialize Note from dictionary. */
export const toNote = (dict: Dictionary): Note => ({
  attachments: (dict.attachments as Dictionary[] | undefined ?? []).map(toAttachment),
  createdAt: dict.created_at as string,
  content: dict.content as string,
  visibility: dict.visibility as Note['visibility'],
  tags: (dict.tags as string[] | undefined) ?? []
})

/** Serialize Note to dictionary. */
export const fromNote = (note: Note): Dictionary => ({
  attachments: note.attachments.map(fromAttachment),
  created_at: note.createdAt,
  content: note.content,
  visibility: note.visibility,
  tags: note.tags
})

/** Deserialize SelectOption from dictionary. */
export const toSelectOption = (dict: Dictionary): SelectOption => ({
  value: dict.value as string,
  label: dict.label as string | undefined,
  requiresNote: dict.requires_note as boolean | undefined
})

/** Serialize SelectOption to dictionary. */
export const fromSelectOption = (option: SelectOption): Dictionary => ({
  value: option.value,
  label: option.label,
  requires_note: option.requiresNote
})

/** Deserialize Question from dictionary. */
export const toQuestion = (dict: Dictionary): Question => {
  const type = dict.type as QuestionType
  switch (type) {
    case 'internal':
      return {
        id: dict.id as string,
        createdAt: dict.created_at as string,
        updatedAt: dict.updated_at as string,
        deletedAt: dict.deleted_at as string | undefined,
        type,
        prompt: dict.prompt as string,
        helpText: dict.help_text as string | undefined,
        required: dict.required as boolean | undefined
      } satisfies InternalQuestion
    case 'text':
    case 'number':
    case 'boolean':
      return {
        id: dict.id as string,
        createdAt: dict.created_at as string,
        updatedAt: dict.updated_at as string,
        deletedAt: dict.deleted_at as string | undefined,
        type,
        prompt: dict.prompt as string,
        helpText: dict.help_text as string | undefined,
        required: dict.required as boolean | undefined
      } satisfies ScalarQuestion
    case 'single-select':
    case 'multi-select':
      return {
        id: dict.id as string,
        createdAt: dict.created_at as string,
        updatedAt: dict.updated_at as string,
        deletedAt: dict.deleted_at as string | undefined,
        type,
        prompt: dict.prompt as string,
        helpText: dict.help_text as string | undefined,
        required: dict.required as boolean | undefined,
        options: (dict.options as Dictionary[] | undefined ?? []).map(toSelectOption)
      } satisfies SelectQuestion
  }
}

/** Serialize Question to dictionary. */
export const fromQuestion = (question: Question): Dictionary => {
  switch (question.type) {
    case 'internal':
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
        required: question.required,
        options: undefined
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

/** Deserialize Answer from dictionary. */
export const toAnswer = (dict: Dictionary): Answer => ({
  questionId: dict.question_id as string,
  notes: (dict.notes as Dictionary[] | undefined ?? []).map(toNote),
  value: dict.value as Answer['value'],
  capturedAt: dict.captured_at as string
})

/** Serialize Answer to dictionary. */
export const fromAnswer = (answer: Answer): Dictionary => ({
  question_id: answer.questionId,
  notes: answer.notes.map(fromNote),
  value: answer.value,
  captured_at: answer.capturedAt
})
