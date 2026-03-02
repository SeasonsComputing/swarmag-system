/**
 * Validators for the common domain area: Question create and update.
 */

import type { Dictionary } from '@core-std'
import { isCompositionPositive, isId, isNonEmptyString } from '@core-std'
import type { QuestionOption, QuestionType } from '@domain/abstractions/common.ts'
import { QUESTION_TYPES } from '@domain/abstractions/common.ts'
import type { QuestionCreate, QuestionUpdate } from '@domain/protocols/common-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates QuestionCreate; returns error message or null. */
export const validateQuestionCreate = (input: QuestionCreate): string | null => {
  if (!isNonEmptyString(input.prompt)) return 'prompt must be a non-empty string'
  if (!QUESTION_TYPES.includes(input.type as QuestionType)) {
    return 'type must be a valid QuestionType'
  }
  if (input.type === 'single-select' || input.type === 'multi-select') {
    const d = input as unknown as Dictionary
    if (!isCompositionPositive(d.options, isQuestionOption)) {
      return 'options must be a non-empty array of valid QuestionOption values'
    }
  }
  return null
}

/** Validates QuestionUpdate; returns error message or null. */
export const validateQuestionUpdate = (input: QuestionUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid UUID'
  const d = input as unknown as Dictionary
  if (d.prompt !== undefined && !isNonEmptyString(d.prompt)) {
    return 'prompt must be a non-empty string'
  }
  if (d.type !== undefined && !QUESTION_TYPES.includes(d.type as QuestionType)) {
    return 'type must be a valid QuestionType'
  }
  if (
    (d.type === 'single-select' || d.type === 'multi-select') && d.options !== undefined
  ) {
    if (!isCompositionPositive(d.options, isQuestionOption)) {
      return 'options must be a non-empty array of valid QuestionOption values'
    }
  }
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATOR GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isQuestionOption = (v: unknown): v is QuestionOption => {
  const d = v as Dictionary
  return isNonEmptyString(d.value)
}
