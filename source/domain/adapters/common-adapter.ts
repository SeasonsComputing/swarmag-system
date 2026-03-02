/**
 * Adapters for common domain types: Location, Attachment, Note, Question, Answer.
 */

import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type {
  Answer,
  Attachment,
  AttachmentKind,
  Location,
  Note,
  NoteVisibility,
  Question,
  QuestionOption,
  ScalarQuestion,
  SelectQuestion
} from '@domain/abstractions/common.ts'

/** Create a Location instance from dictionary representation. */
export const toLocation = (dict: Dictionary): Location => {
  if (dict.latitude == null) {
    return notValid('Location dictionary missing required field: latitude')
  }
  if (dict.longitude == null) {
    return notValid('Location dictionary missing required field: longitude')
  }
  return {
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
  }
}

/** Create a dictionary representation of a Location instance. */
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

/** Create an Attachment instance from dictionary representation. */
export const toAttachment = (dict: Dictionary): Attachment => {
  if (!dict.filename) {
    return notValid('Attachment dictionary missing required field: filename')
  }
  if (!dict.url) return notValid('Attachment dictionary missing required field: url')
  if (!dict.content_type) {
    return notValid('Attachment dictionary missing required field: content_type')
  }
  if (!dict.kind) return notValid('Attachment dictionary missing required field: kind')
  if (!dict.uploaded_at) {
    return notValid('Attachment dictionary missing required field: uploaded_at')
  }
  if (!dict.uploaded_by_id) {
    return notValid('Attachment dictionary missing required field: uploaded_by_id')
  }
  return {
    filename: dict.filename as string,
    url: dict.url as string,
    contentType: dict.content_type as string,
    kind: dict.kind as AttachmentKind,
    uploadedAt: dict.uploaded_at as When,
    uploadedById: dict.uploaded_by_id as string
  }
}

/** Create a dictionary representation of an Attachment instance. */
export const fromAttachment = (attachment: Attachment): Dictionary => ({
  filename: attachment.filename,
  url: attachment.url,
  content_type: attachment.contentType,
  kind: attachment.kind,
  uploaded_at: attachment.uploadedAt,
  uploaded_by_id: attachment.uploadedById
})

/** Create a Note instance from dictionary representation. */
export const toNote = (dict: Dictionary): Note => {
  if (!dict.content) return notValid('Note dictionary missing required field: content')
  if (!dict.created_at) {
    return notValid('Note dictionary missing required field: created_at')
  }
  return {
    content: dict.content as string,
    createdAt: dict.created_at as When,
    authorId: dict.author_id as string | undefined,
    visibility: dict.visibility as NoteVisibility | undefined,
    tags: dict.tags as string[],
    attachments: (dict.attachments as Dictionary[]).map(toAttachment)
  }
}

/** Create a dictionary representation of a Note instance. */
export const fromNote = (note: Note): Dictionary => ({
  content: note.content,
  created_at: note.createdAt,
  author_id: note.authorId,
  visibility: note.visibility,
  tags: note.tags,
  attachments: note.attachments.map(fromAttachment)
})

const toQuestionOption = (dict: Dictionary): QuestionOption => {
  if (!dict.value) {
    return notValid('QuestionOption dictionary missing required field: value')
  }
  return {
    value: dict.value as string,
    label: dict.label as string | undefined,
    requiresNote: dict.requires_note as boolean | undefined
  }
}

const fromQuestionOption = (option: QuestionOption): Dictionary => ({
  value: option.value,
  label: option.label,
  requires_note: option.requiresNote
})

/** Create a Question instance from dictionary representation; dispatches on type discriminator. */
export const toQuestion = (dict: Dictionary): Question => {
  const type = dict.type as Question['type']
  if (type === 'single-select' || type === 'multi-select') {
    return {
      id: dict.id as string,
      type,
      prompt: dict.prompt as string,
      helpText: dict.help_text as string | undefined,
      required: dict.required as boolean | undefined,
      options: (dict.options as Dictionary[]).map(toQuestionOption),
      createdAt: dict.created_at as When,
      updatedAt: dict.updated_at as When,
      deletedAt: dict.deleted_at as When | undefined
    } satisfies SelectQuestion
  }
  return {
    id: dict.id as string,
    type,
    prompt: dict.prompt as string,
    helpText: dict.help_text as string | undefined,
    required: dict.required as boolean | undefined,
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  } satisfies ScalarQuestion
}

/** Create a dictionary representation of a Question instance. */
export const fromQuestion = (question: Question): Dictionary => {
  if (question.type === 'single-select' || question.type === 'multi-select') {
    return {
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      help_text: question.helpText,
      required: question.required,
      options: question.options.map(fromQuestionOption),
      created_at: question.createdAt,
      updated_at: question.updatedAt,
      deleted_at: question.deletedAt
    }
  }
  return {
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    help_text: question.helpText,
    required: question.required,
    created_at: question.createdAt,
    updated_at: question.updatedAt,
    deleted_at: question.deletedAt
  }
}

/** Create an Answer instance from dictionary representation. */
export const toAnswer = (dict: Dictionary): Answer => {
  if (!dict.question_id) {
    return notValid('Answer dictionary missing required field: question_id')
  }
  if (!dict.captured_by_id) {
    return notValid('Answer dictionary missing required field: captured_by_id')
  }
  if (!dict.captured_at) {
    return notValid('Answer dictionary missing required field: captured_at')
  }
  return {
    questionId: dict.question_id as string,
    capturedById: dict.captured_by_id as string,
    value: dict.value as Answer['value'],
    capturedAt: dict.captured_at as When,
    notes: (dict.notes as Dictionary[]).map(toNote)
  }
}

/** Create a dictionary representation of an Answer instance. */
export const fromAnswer = (answer: Answer): Dictionary => ({
  question_id: answer.questionId,
  captured_by_id: answer.capturedById,
  value: answer.value,
  captured_at: answer.capturedAt,
  notes: answer.notes.map(fromNote)
})
