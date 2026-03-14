/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Common domain adapters                                                      ║
║ Dictionary serialization for common topic abstractions                      ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Serializes common topic abstractions between Dictionary and domain shapes.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toLocation                          Deserialize Location from Dictionary.
fromLocation                        Serialize Location to Dictionary.
toAttachment                        Deserialize Attachment from Dictionary.
fromAttachment                      Serialize Attachment to Dictionary.
toNote                              Deserialize Note from Dictionary.
fromNote                            Serialize Note to Dictionary.
toSelectOption                      Deserialize SelectOption from Dictionary.
fromSelectOption                    Serialize SelectOption to Dictionary.
toQuestion                          Deserialize Question from Dictionary.
fromQuestion                        Serialize Question to Dictionary.
toAnswer                            Deserialize Answer from Dictionary.
fromAnswer                          Serialize Answer to Dictionary.
*/

import type { Dictionary, Id, When } from '@core/std'
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

/** Deserialize Location from Dictionary. */
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
  recordedAt: dict.recorded_at as When | undefined,
  accuracyMeters: dict.accuracy_meters as number | undefined,
  description: dict.description as string | undefined
})

/** Serialize Location to Dictionary. */
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

/** Deserialize Attachment from Dictionary. */
export const toAttachment = (dict: Dictionary): Attachment => ({
  filename: dict.filename as string,
  url: dict.url as string,
  contentType: dict.content_type as string,
  kind: dict.kind as Attachment['kind'],
  uploadedAt: dict.uploaded_at as When
})

/** Serialize Attachment to Dictionary. */
export const fromAttachment = (attachment: Attachment): Dictionary => ({
  filename: attachment.filename,
  url: attachment.url,
  content_type: attachment.contentType,
  kind: attachment.kind,
  uploaded_at: attachment.uploadedAt
})

/** Deserialize Note from Dictionary. */
export const toNote = (dict: Dictionary): Note => ({
  createdAt: dict.created_at as When,
  content: dict.content as string,
  visibility: dict.visibility as Note['visibility'],
  tags: dict.tags as string[],
  attachments: (dict.attachments as Dictionary[]).map(toAttachment)
})

/** Serialize Note to Dictionary. */
export const fromNote = (note: Note): Dictionary => ({
  created_at: note.createdAt,
  content: note.content,
  visibility: note.visibility,
  tags: note.tags,
  attachments: note.attachments.map(fromAttachment)
})

/** Deserialize SelectOption from Dictionary. */
export const toSelectOption = (dict: Dictionary): SelectOption => ({
  value: dict.value as string,
  label: dict.label as string | undefined,
  requiresNote: dict.requires_note as boolean | undefined
})

/** Serialize SelectOption to Dictionary. */
export const fromSelectOption = (selectOption: SelectOption): Dictionary => ({
  value: selectOption.value,
  label: selectOption.label,
  requires_note: selectOption.requiresNote
})

/** Deserialize Question from Dictionary. */
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
        options: (dict.options as Dictionary[]).map(toSelectOption)
      } satisfies SelectQuestion
  }
}

/** Serialize Question to Dictionary. */
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
        options: []
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

/** Deserialize Answer from Dictionary. */
export const toAnswer = (dict: Dictionary): Answer => ({
  questionId: dict.question_id as Id,
  value: dict.value as Answer['value'],
  capturedAt: dict.captured_at as When,
  notes: (dict.notes as Dictionary[]).map(toNote)
})

/** Serialize Answer to Dictionary. */
export const fromAnswer = (answer: Answer): Dictionary => ({
  question_id: answer.questionId,
  value: answer.value,
  captured_at: answer.capturedAt,
  notes: answer.notes.map(fromNote)
})
