/**
 * Common domain adapters.
 */

import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type {
  Answer,
  Attachment,
  AttachmentKind,
  Note,
  NoteVisibility,
  Question,
  QuestionType,
  ScalarQuestion,
  SelectableOption,
  SelectQuestion
} from '@domain/abstractions/common.ts'

/** Create a Location from its dictionary representation. */
export const toLocation = (
  dict: Dictionary
): import('@domain/abstractions/common.ts').Location => {
  if (dict.latitude === undefined) {
    return notValid('Location dictionary missing required field: latitude')
  }
  if (dict.longitude === undefined) {
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

/** Create a dictionary representation from a Location. */
export const fromLocation = (
  location: import('@domain/abstractions/common.ts').Location
): Dictionary => ({
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

/** Create an Attachment from its dictionary representation. */
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

/** Create a dictionary representation from an Attachment. */
export const fromAttachment = (attachment: Attachment): Dictionary => ({
  filename: attachment.filename,
  url: attachment.url,
  content_type: attachment.contentType,
  kind: attachment.kind,
  uploaded_at: attachment.uploadedAt,
  uploaded_by_id: attachment.uploadedById
})

/** Create a Note from its dictionary representation. */
export const toNote = (dict: Dictionary): Note => {
  if (!dict.created_at) {
    return notValid('Note dictionary missing required field: created_at')
  }
  if (!dict.content) return notValid('Note dictionary missing required field: content')
  if (!dict.tags) return notValid('Note dictionary missing required field: tags')
  if (!dict.attachments) {
    return notValid('Note dictionary missing required field: attachments')
  }

  return {
    createdAt: dict.created_at as When,
    content: dict.content as string,
    visibility: dict.visibility as NoteVisibility | undefined,
    tags: (dict.tags as string[]).map(value => value),
    attachments: (dict.attachments as Dictionary[]).map(toAttachment)
  }
}

/** Create a dictionary representation from a Note. */
export const fromNote = (note: Note): Dictionary => ({
  created_at: note.createdAt,
  content: note.content,
  visibility: note.visibility,
  tags: note.tags.map(value => value),
  attachments: note.attachments.map(fromAttachment)
})

/** Create a SelectableOption from its dictionary representation. */
export const toSelectableOption = (dict: Dictionary): SelectableOption => {
  if (!dict.value) {
    return notValid('SelectableOption dictionary missing required field: value')
  }

  return {
    value: dict.value as string,
    label: dict.label as string | undefined,
    requiresNote: dict.requires_note as boolean | undefined
  }
}

/** Create a dictionary representation from a SelectableOption. */
export const fromSelectableOption = (option: SelectableOption): Dictionary => ({
  value: option.value,
  label: option.label,
  requires_note: option.requiresNote
})

/** Create a Question from its dictionary representation. */
export const toQuestion = (dict: Dictionary): Question => {
  if (!dict.id) return notValid('Question dictionary missing required field: id')
  if (!dict.type) return notValid('Question dictionary missing required field: type')
  if (!dict.prompt) return notValid('Question dictionary missing required field: prompt')
  if (!dict.created_at) {
    return notValid('Question dictionary missing required field: created_at')
  }
  if (!dict.updated_at) {
    return notValid('Question dictionary missing required field: updated_at')
  }

  const type = dict.type as QuestionType

  switch (type) {
    case 'single-select':
    case 'multi-select':
      if (!dict.options) {
        return notValid('Question dictionary missing required field: options')
      }

      return {
        id: dict.id as string,
        type,
        prompt: dict.prompt as string,
        helpText: dict.help_text as string | undefined,
        required: dict.required as boolean | undefined,
        options: (dict.options as Dictionary[]).map(toSelectableOption),
        createdAt: dict.created_at as When,
        updatedAt: dict.updated_at as When,
        deletedAt: dict.deleted_at as When | undefined
      } satisfies SelectQuestion

    case 'text':
    case 'number':
    case 'boolean':
    case 'internal':
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
}

/** Create a dictionary representation from a Question. */
export const fromQuestion = (question: Question): Dictionary => {
  switch (question.type) {
    case 'single-select':
    case 'multi-select':
      return {
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        help_text: question.helpText,
        required: question.required,
        options: question.options.map(fromSelectableOption),
        created_at: question.createdAt,
        updated_at: question.updatedAt,
        deleted_at: question.deletedAt
      }

    case 'text':
    case 'number':
    case 'boolean':
    case 'internal':
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
}

/** Create an Answer from its dictionary representation. */
export const toAnswer = (dict: Dictionary): Answer => {
  if (!dict.question_id) {
    return notValid('Answer dictionary missing required field: question_id')
  }
  if (dict.value === undefined) {
    return notValid('Answer dictionary missing required field: value')
  }
  if (!dict.captured_at) {
    return notValid('Answer dictionary missing required field: captured_at')
  }
  if (!dict.captured_by_id) {
    return notValid('Answer dictionary missing required field: captured_by_id')
  }
  if (!dict.notes) return notValid('Answer dictionary missing required field: notes')

  return {
    questionId: dict.question_id as string,
    value: dict.value as string | number | boolean | string[],
    capturedAt: dict.captured_at as When,
    capturedById: dict.captured_by_id as string,
    notes: (dict.notes as Dictionary[]).map(toNote)
  }
}

/** Create a dictionary representation from an Answer. */
export const fromAnswer = (answer: Answer): Dictionary => ({
  question_id: answer.questionId,
  value: answer.value,
  captured_at: answer.capturedAt,
  captured_by_id: answer.capturedById,
  notes: answer.notes.map(fromNote)
})
