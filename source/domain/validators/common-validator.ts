/**
 * Common protocol validators.
 */

import {
  type Dictionary,
  isCompositionMany,
  isCompositionPositive,
  isId,
  isNonEmptyString,
  isWhen
} from '@core-std'
import {
  type Answer,
  type Attachment,
  ATTACHMENT_KINDS,
  type Note,
  NOTE_VISIBILITIES,
  QUESTION_TYPES,
  type QuestionType,
  SELECT_QUESTION_TYPES,
  type SelectableOption,
  type SelectQuestionType
} from '@domain/abstractions/common.ts'
import type {
  QuestionCreate,
  QuestionUpdate
} from '@domain/protocols/common-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates QuestionCreate; returns error message or null. */
export const validateQuestionCreate = (input: QuestionCreate): string | null => {
  if (!isNonEmptyString(input.prompt)) return 'prompt must be a non-empty string'
  if (!QUESTION_TYPES.includes(input.type as QuestionType)) {
    return 'type must be a valid QuestionType'
  }

  if (input.helpText !== undefined && !isNonEmptyString(input.helpText)) {
    return 'helpText must be a non-empty string when provided'
  }
  if (input.required !== undefined && typeof input.required !== 'boolean') {
    return 'required must be a boolean when provided'
  }

  switch (input.type) {
    case 'single-select':
    case 'multi-select':
      if (!isCompositionPositive(input.options, isSelectableOption)) {
        return 'options must be a non-empty array of valid SelectableOption values'
      }
      return null

    case 'text':
    case 'number':
    case 'boolean':
    case 'internal':
      return null
  }
}

/** Validates QuestionUpdate; returns error message or null. */
export const validateQuestionUpdate = (input: QuestionUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'

  if (input.type !== undefined && !QUESTION_TYPES.includes(input.type as QuestionType)) {
    return 'type must be a valid QuestionType when provided'
  }
  if (input.prompt !== undefined && !isNonEmptyString(input.prompt)) {
    return 'prompt must be a non-empty string when provided'
  }
  if (input.helpText !== undefined && !isNonEmptyString(input.helpText)) {
    return 'helpText must be a non-empty string when provided'
  }
  if (input.required !== undefined && typeof input.required !== 'boolean') {
    return 'required must be a boolean when provided'
  }
  const options = 'options' in input ? input.options : undefined
  if (
    options !== undefined
    && !isCompositionPositive(options, isSelectableOption)
  ) {
    return 'options must be a non-empty array of valid SelectableOption values when provided'
  }

  if (
    options !== undefined
    && input.type !== undefined
    && !SELECT_QUESTION_TYPES.includes(input.type as SelectQuestionType)
  ) {
    return 'options may only be provided when type is single-select or multi-select'
  }

  return null
}

// ────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ────────────────────────────────────────────────────────────────────────────

export const isAttachment = (value: unknown): value is Attachment => {
  if (typeof value !== 'object' || value === null) return false

  const data = value as Dictionary

  if (!isNonEmptyString(data.filename)) return false
  if (!isNonEmptyString(data.url)) return false
  if (!isNonEmptyString(data.contentType)) return false
  if (!ATTACHMENT_KINDS.includes(data.kind as (typeof ATTACHMENT_KINDS)[number])) {
    return false
  }
  if (!isWhen(data.uploadedAt)) return false
  if (!isId(data.uploadedById)) return false

  return true
}

export const isNote = (value: unknown): value is Note => {
  if (typeof value !== 'object' || value === null) return false

  const data = value as Dictionary

  if (!isWhen(data.createdAt)) return false
  if (!isNonEmptyString(data.content)) return false
  if (
    data.visibility !== undefined
    && !NOTE_VISIBILITIES.includes(data.visibility as (typeof NOTE_VISIBILITIES)[number])
  ) {
    return false
  }
  if (!isCompositionMany(data.tags, (v): v is string => isNonEmptyString(v))) return false
  if (!isCompositionMany(data.attachments, isAttachment)) return false

  return true
}

export const isSelectableOption = (value: unknown): value is SelectableOption => {
  if (typeof value !== 'object' || value === null) return false

  const data = value as Dictionary

  if (!isNonEmptyString(data.value)) return false
  if (data.label !== undefined && !isNonEmptyString(data.label)) return false
  if (data.requiresNote !== undefined && typeof data.requiresNote !== 'boolean') {
    return false
  }

  return true
}

export const isAnswer = (value: unknown): value is Answer => {
  if (typeof value !== 'object' || value === null) return false

  const data = value as Dictionary

  if (!isId(data.questionId)) return false

  const answerValue = data.value
  const isScalarValue = typeof answerValue === 'string'
    || typeof answerValue === 'number'
    || typeof answerValue === 'boolean'
  const isMultiSelectValue = isCompositionMany(answerValue,
    (v): v is string => typeof v === 'string')
  if (!isScalarValue && !isMultiSelectValue) return false

  if (!isWhen(data.capturedAt)) return false
  if (!isId(data.capturedById)) return false
  if (!isCompositionMany(data.notes, isNote)) return false

  return true
}
