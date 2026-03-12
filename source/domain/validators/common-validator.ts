/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Common domain validator                                                      ║
║ Boundary validation for common topic abstractions.                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for Question. Also exports
shared guards (isNote, isLocation) used by other domain validators.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
validateQuestionCreate  Validate QuestionCreate payloads.
validateQuestionUpdate  Validate QuestionUpdate payloads.
isNote                  Type guard for Note; used by other validators.
isLocation              Type guard for Location; used by other validators.
*/

import {
  expectBoolean,
  expectCompositionPositive,
  expectConstEnum,
  type ExpectGuard,
  expectId,
  expectNonEmptyString,
  type ExpectResult,
  expectValid
} from '@core/std'
import {
  type Location,
  type Note,
  QUESTION_TYPES,
  type SelectOption
} from '@domain/abstractions/common.ts'
import type {
  QuestionCreate,
  QuestionUpdate,
  SelectQuestionCreate,
  SelectQuestionUpdate
} from '@domain/protocols/common-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validate QuestionCreate payloads. */
export const validateQuestionCreate = (input: QuestionCreate): ExpectResult => {
  const typeError = expectConstEnum(input.type, 'type', QUESTION_TYPES)
  if (typeError) return typeError
  switch (input.type) {
    case 'internal':
      return null
    case 'text':
    case 'number':
    case 'boolean':
      return null
    case 'single-select':
    case 'multi-select':
      return expectCompositionPositive(
        (input as SelectQuestionCreate).options,
        'options',
        isSelectOption
      )
  }
}

/** Validate QuestionUpdate payloads. */
export const validateQuestionUpdate = (input: QuestionUpdate): ExpectResult => {
  const idError = expectId(input.id, 'id')
  if (idError) return idError
  const typeError = expectConstEnum(input.type, 'type', QUESTION_TYPES, true)
  if (typeError) return typeError
  return expectValid(
    expectNonEmptyString(input.prompt, 'prompt', true),
    expectBoolean(input.required, 'required', true),
    expectCompositionPositive(
      (input as SelectQuestionUpdate).options,
      'options',
      isSelectOption,
      true
    )
  )
}

/** Type guard for Note; used by other validators. */
export const isNote = (v: unknown): v is Note => v !== null && typeof v === 'object'

/** Type guard for Location; used by other validators. */
export const isLocation = (v: unknown): v is Location => v !== null && typeof v === 'object'

// ────────────────────────────────────────────────────────────────────────────
// GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isSelectOption: ExpectGuard<SelectOption> = (v): v is SelectOption =>
  v !== null && typeof v === 'object'
