/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Common protocol validators                                                   ║
║ Boundary validation for shared question and object payload shapes.           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates common protocol payloads and exports common object type guards.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateQuestionCreate(input)  Validate QuestionCreate payloads.
validateQuestionUpdate(input)  Validate QuestionUpdate payloads.
isLocation(v)                  Guard for Location object values.
isAttachment(v)                Guard for Attachment object values.
isNote(v)                      Guard for Note object values.
isSelectOption(v)              Guard for SelectOption object values.
isAnswer(v)                    Guard for Answer object values.
*/

import {
  expectBoolean,
  expectCompositionMany,
  expectCompositionPositive,
  expectConstEnum,
  expectId,
  expectNonEmptyString,
  type ExpectResult,
  expectValid,
  expectWhen,
  isNonEmptyString
} from '@core/std'
import {
  type Answer,
  type Attachment,
  ATTACHMENT_KINDS,
  type Location,
  type Note,
  NOTE_VISIBILITIES,
  QUESTION_TYPES,
  type SelectOption
} from '@domain/abstractions/common.ts'
import type { QuestionCreate, QuestionUpdate } from '@domain/protocols/common-protocol.ts'

/** Validate QuestionCreate payloads. */
export const validateQuestionCreate = (input: QuestionCreate): ExpectResult => {
  const typeError = expectConstEnum(input.type, 'type', QUESTION_TYPES)
  if (typeError) return typeError

  const baseError = expectValid(
    expectNonEmptyString(input.prompt, 'prompt'),
    expectNonEmptyString(input.helpText, 'helpText', true),
    expectBoolean(input.required, 'required', true)
  )
  if (baseError) return baseError

  switch (input.type) {
    case 'internal':
    case 'text':
    case 'number':
    case 'boolean':
      return null
    case 'single-select':
    case 'multi-select':
      return expectCompositionPositive(input.options, 'options', isSelectOption)
  }
}

/** Validate QuestionUpdate payloads. */
export const validateQuestionUpdate = (input: QuestionUpdate): ExpectResult => {
  const typeError = expectConstEnum(input.type, 'type', QUESTION_TYPES, true)
  if (typeError) return typeError

  const baseError = expectValid(
    expectId(input.id, 'id'),
    expectNonEmptyString(input.prompt, 'prompt', true),
    expectNonEmptyString(input.helpText, 'helpText', true),
    expectBoolean(input.required, 'required', true)
  )
  if (baseError) return baseError

  if (input.type === undefined) return null
  switch (input.type) {
    case 'internal':
    case 'text':
    case 'number':
    case 'boolean':
      return null
    case 'single-select':
    case 'multi-select':
      return expectCompositionPositive(input.options, 'options', isSelectOption, true)
  }
}

/** Guard for Location values. */
export const isLocation = (v: unknown): v is Location => {
  if (v === null || typeof v !== 'object') return false
  const location = v as Location
  return expectValid(
        expectNonEmptyString(location.line1, 'line1', true),
        expectNonEmptyString(location.line2, 'line2', true),
        expectNonEmptyString(location.city, 'city', true),
        expectNonEmptyString(location.state, 'state', true),
        expectNonEmptyString(location.postalCode, 'postalCode', true),
        expectNonEmptyString(location.country, 'country', true),
        expectWhen(location.recordedAt, 'recordedAt', true)
      ) === null && typeof location.latitude === 'number' && typeof location.longitude === 'number'
}

/** Guard for Attachment values. */
export const isAttachment = (v: unknown): v is Attachment => {
  if (v === null || typeof v !== 'object') return false
  const attachment = v as Attachment
  return expectValid(
    expectNonEmptyString(attachment.filename, 'filename'),
    expectNonEmptyString(attachment.url, 'url'),
    expectNonEmptyString(attachment.contentType, 'contentType'),
    expectConstEnum(attachment.kind, 'kind', ATTACHMENT_KINDS),
    expectWhen(attachment.uploadedAt, 'uploadedAt')
  ) === null
}

/** Guard for Note values. */
export const isNote = (v: unknown): v is Note => {
  if (v === null || typeof v !== 'object') return false
  const note = v as Note
  return expectValid(
    expectCompositionMany(note.attachments, 'attachments', isAttachment),
    expectWhen(note.createdAt, 'createdAt'),
    expectNonEmptyString(note.content, 'content'),
    expectConstEnum(note.visibility, 'visibility', NOTE_VISIBILITIES),
    expectCompositionMany(note.tags, 'tags', isNonEmptyString)
  ) === null
}

/** Guard for SelectOption values. */
export const isSelectOption = (v: unknown): v is SelectOption => {
  if (v === null || typeof v !== 'object') return false
  const option = v as SelectOption
  return expectValid(
    expectNonEmptyString(option.value, 'value'),
    expectNonEmptyString(option.label, 'label', true),
    expectBoolean(option.requiresNote, 'requiresNote', true)
  ) === null
}

/** Guard for Answer values. */
export const isAnswer = (v: unknown): v is Answer => {
  if (v === null || typeof v !== 'object') return false
  const answer = v as Answer
  const value = answer.value
  const isAllowedValue = typeof value === 'string' || typeof value === 'number'
    || typeof value === 'boolean'
    || (Array.isArray(value) && value.every(item => typeof item === 'string'))

  return expectValid(
        expectId(answer.questionId, 'questionId'),
        expectCompositionMany(answer.notes, 'notes', isNote),
        expectWhen(answer.capturedAt, 'capturedAt')
      ) === null && isAllowedValue
}
