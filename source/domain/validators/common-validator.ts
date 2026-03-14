/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Common protocol validators                                                  ║
║ Boundary validation for common protocol payloads                            ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update payloads for Question protocol contracts.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateQuestionCreate              Validate QuestionCreate payloads.
validateQuestionUpdate              Validate QuestionUpdate payloads.
*/

import {
  expectCompositionPositive,
  expectConstEnum,
  expectId,
  expectNonEmptyString,
  type ExpectResult,
  expectValid
} from '@core/std'
import {
  QUESTION_TYPES,
  type QuestionType,
  SELECT_QUESTION_TYPES,
  type SelectOption
} from '@domain/abstractions/common.ts'
import type { QuestionCreate, QuestionUpdate } from '@domain/protocols/common-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validate QuestionCreate payloads. */
export const validateQuestionCreate = (input: QuestionCreate): ExpectResult => {
  const typeError = expectConstEnum(input.type, 'type', QUESTION_TYPES)
  if (typeError) return typeError

  const base = expectValid(
    expectNonEmptyString(input.prompt, 'prompt'),
    expectNonEmptyString(input.helpText, 'helpText', true)
  )
  if (base) return base

  if (isSelectQuestionType(input.type)) {
    const options = 'options' in input ? input.options : undefined
    return expectCompositionPositive(options, 'options', isSelectOption)
  }

  return null
}

/** Validate QuestionUpdate payloads. */
export const validateQuestionUpdate = (input: QuestionUpdate): ExpectResult => {
  const base = expectValid(
    expectId(input.id, 'id'),
    expectConstEnum(input.type, 'type', QUESTION_TYPES, true),
    expectNonEmptyString(input.prompt, 'prompt', true),
    expectNonEmptyString(input.helpText, 'helpText', true)
  )
  if (base) return base

  if (input.type && isSelectQuestionType(input.type)) {
    const options = 'options' in input ? input.options : undefined
    return expectCompositionPositive(options, 'options', isSelectOption, true)
  }

  return null
}

// ────────────────────────────────────────────────────────────────────────────
// GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isSelectQuestionType = (value: QuestionType): boolean =>
  expectConstEnum(value, 'type', SELECT_QUESTION_TYPES) === null

const isSelectOption = (value: unknown): value is SelectOption =>
  value !== null && typeof value === 'object'
