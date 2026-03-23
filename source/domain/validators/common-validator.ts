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
isLocation                          Typed object guard for Location.
isAttachment                        Typed object guard for Attachment.
isNote                              Typed object guard for Note.
isSelectOption                      Typed object guard for SelectOption.
isAnswer                            Typed object guard for Answer.
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
  type Answer,
  type Attachment,
  type Location,
  type Note,
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

/** Typed object guard for Location. */
export const isLocation = (value: unknown): value is Location =>
  value !== null && typeof value === 'object'

/** Typed object guard for Attachment. */
export const isAttachment = (value: unknown): value is Attachment =>
  value !== null && typeof value === 'object'

/** Typed object guard for Note. */
export const isNote = (value: unknown): value is Note => value !== null && typeof value === 'object'

/** Typed object guard for SelectOption. */
export const isSelectOption = (value: unknown): value is SelectOption =>
  value !== null && typeof value === 'object'

/** Typed object guard for Answer. */
export const isAnswer = (value: unknown): value is Answer => value !== null && typeof value === 'object'
