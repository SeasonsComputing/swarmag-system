/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Common protocol validators                                                  ║
║ Shared guards and question protocol validation for common abstractions.     ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates common protocol inputs and centralizes shared composition guards
used across all domain validators.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
validateQuestionCreate(input)  Validate QuestionCreate payloads.
validateQuestionUpdate(input)  Validate QuestionUpdate payloads.
isAttachment(value)            Guard for Attachment composition values.
isNote(value)                  Guard for Note composition values.
isAnswer(value)                Guard for Answer composition values.
isSelectOption(value)          Guard for SelectOption composition values.
*/

import {
  type Dictionary,
  expectBoolean,
  expectCompositionMany,
  expectCompositionPositive,
  expectConstEnum,
  expectId,
  expectNonEmptyString,
  expectValid,
  expectWhen,
  isString
} from '@core-std'
import {
  type Answer,
  type Attachment,
  ATTACHMENT_KINDS,
  type Note,
  NOTE_VISIBILITIES,
  QUESTION_TYPES,
  SELECT_QUESTION_TYPES,
  type SelectOption,
  type SelectQuestionType
} from '@domain/abstractions/common.ts'
import type { QuestionCreate, QuestionUpdate } from '@domain/protocols/common-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates QuestionCreate; returns error message or null. */
export const validateQuestionCreate = (input: QuestionCreate): string | null => {
  const error = expectValid(
    expectNonEmptyString(input.prompt, 'prompt'),
    expectConstEnum(input.type, 'type', QUESTION_TYPES),
    expectNonEmptyString(input.helpText, 'helpText', true),
    expectBoolean(input.required, 'required', true)
  )
  if (error) return error

  switch (input.type) {
    case 'single-select':
    case 'multi-select':
      return expectCompositionPositive(input.options, 'options', isSelectOption)

    case 'internal':
    case 'text':
    case 'number':
    case 'boolean':
      return null
  }
}

/** Validates QuestionUpdate; returns error message or null. */
export const validateQuestionUpdate = (input: QuestionUpdate): string | null => {
  const options = 'options' in input ? input.options : undefined
  return expectValid(
    expectId(input.id, 'id'),
    expectConstEnum(input.type, 'type', QUESTION_TYPES, true),
    expectNonEmptyString(input.prompt, 'prompt', true),
    expectNonEmptyString(input.helpText, 'helpText', true),
    expectBoolean(input.required, 'required', true),
    expectCompositionPositive(options, 'options', isSelectOption, true),
    expectOptionsMatchType(options, input.type)
  )
}

// ────────────────────────────────────────────────────────────────────────────
// GUARDS
// ────────────────────────────────────────────────────────────────────────────

export const isAttachment = (value: unknown): value is Attachment => {
  if (typeof value !== 'object' || value === null) return false
  const data = value as Dictionary
  return expectValid(
    expectNonEmptyString(data.filename, 'filename'),
    expectNonEmptyString(data.url, 'url'),
    expectNonEmptyString(data.contentType, 'contentType'),
    expectConstEnum(data.kind, 'kind', ATTACHMENT_KINDS),
    expectWhen(data.uploadedAt, 'uploadedAt')
  ) === null
}

export const isNote = (value: unknown): value is Note => {
  if (typeof value !== 'object' || value === null) return false
  const data = value as Dictionary
  return expectValid(
    expectCompositionMany(data.attachments, 'attachments', isAttachment),
    expectWhen(data.createdAt, 'createdAt'),
    expectNonEmptyString(data.content, 'content'),
    expectConstEnum(data.visibility, 'visibility', NOTE_VISIBILITIES, true),
    expectCompositionMany(data.tags, 'tags', isString)
  ) === null
}

export const isSelectOption = (value: unknown): value is SelectOption => {
  if (typeof value !== 'object' || value === null) return false
  const data = value as Dictionary
  return expectValid(
    expectNonEmptyString(data.value, 'value'),
    expectNonEmptyString(data.label, 'label', true),
    expectBoolean(data.requiresNote, 'requiresNote', true)
  ) === null
}

export const isAnswer = (value: unknown): value is Answer => {
  if (typeof value !== 'object' || value === null) return false
  const data = value as Dictionary
  const answerValue = data.value
  const isScalar = isString(answerValue)
    || typeof answerValue === 'number'
    || typeof answerValue === 'boolean'
  const isStringArray = expectCompositionMany(answerValue, 'value', isString) === null
  const valueError = !isScalar && !isStringArray
    ? 'value must be string, number, boolean, or string[]'
    : null
  return expectValid(
    expectId(data.questionId, 'questionId'),
    expectId(data.capturedById, 'capturedById'),
    expectCompositionMany(data.notes, 'notes', isNote),
    valueError,
    expectWhen(data.capturedAt, 'capturedAt')
  ) === null
}

const expectOptionsMatchType = (
  options: unknown,
  type: unknown
): string | null => {
  if (options === undefined || type === undefined) return null
  if (SELECT_QUESTION_TYPES.includes(type as SelectQuestionType)) return null
  return 'options may only be provided when type is single-select or multi-select'
}
