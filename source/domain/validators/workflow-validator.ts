/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Workflow protocol validators                                                 ║
║ Boundary validation for workflow protocol payloads.                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for workflow abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateQuestionCreate(input)      Validate QuestionCreate payloads.
validateQuestionUpdate(input)      Validate QuestionUpdate payloads.
validateTaskCreate(input)          Validate TaskCreate payloads.
validateTaskUpdate(input)          Validate TaskUpdate payloads.
validateTaskQuestionCreate(input)  Validate TaskQuestionCreate payloads.
validateTaskQuestionUpdate(input)  Validate TaskQuestionUpdate payloads.
validateWorkflowCreate(input)      Validate WorkflowCreate payloads.
validateWorkflowUpdate(input)      Validate WorkflowUpdate payloads.
validateWorkflowTaskCreate(input)  Validate WorkflowTaskCreate payloads.
validateWorkflowTaskUpdate(input)  Validate WorkflowTaskUpdate payloads.
isSelectOption(v)                  Guard for SelectOption object values.
isAnswer(v)                        Guard for Answer object values.
*/

import {
  expectBoolean,
  expectCompositionMany,
  expectCompositionPositive,
  expectConstEnum,
  expectId,
  expectNonEmptyString,
  expectPositiveNumber,
  type ExpectResult,
  expectValid,
  expectWhen,
  isNonEmptyString
} from '@core/std'
import type { Answer, SelectOption } from '@domain/abstractions/workflow.ts'
import { QUESTION_TYPES } from '@domain/abstractions/workflow.ts'
import type {
  QuestionCreate,
  QuestionUpdate,
  TaskCreate,
  TaskQuestionCreate,
  TaskQuestionUpdate,
  TaskUpdate,
  WorkflowCreate,
  WorkflowTaskCreate,
  WorkflowTaskUpdate,
  WorkflowUpdate
} from '@domain/protocols/workflow-protocol.ts'
import { isNote } from '@domain/validators/common-validator.ts'

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

/** Validate TaskCreate payloads. */
export const validateTaskCreate = (input: TaskCreate): ExpectResult =>
  expectValid(
    expectCompositionMany(input.notes, 'notes', isNote),
    expectNonEmptyString(input.label, 'label'),
    expectNonEmptyString(input.description, 'description', true)
  )

/** Validate TaskUpdate payloads. */
export const validateTaskUpdate = (input: TaskUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectCompositionMany(input.notes, 'notes', isNote, true),
    expectNonEmptyString(input.label, 'label', true),
    expectNonEmptyString(input.description, 'description', true)
  )

/** Validate TaskQuestionCreate payloads. */
export const validateTaskQuestionCreate = (input: TaskQuestionCreate): ExpectResult =>
  expectValid(
    expectId(input.taskId, 'taskId'),
    expectId(input.questionId, 'questionId'),
    expectPositiveNumber(input.sequence, 'sequence')
  )

/** Validate TaskQuestionUpdate payloads. */
export const validateTaskQuestionUpdate = (input: TaskQuestionUpdate): ExpectResult =>
  validateTaskQuestionCreate(input)

/** Validate WorkflowCreate payloads. */
export const validateWorkflowCreate = (input: WorkflowCreate): ExpectResult =>
  expectValid(
    expectCompositionMany(input.notes, 'notes', isNote),
    expectNonEmptyString(input.name, 'name'),
    expectNonEmptyString(input.description, 'description', true),
    expectPositiveNumber(input.version, 'version'),
    expectCompositionMany(input.tags, 'tags', isNonEmptyString)
  )

/** Validate WorkflowUpdate payloads. */
export const validateWorkflowUpdate = (input: WorkflowUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectCompositionMany(input.notes, 'notes', isNote, true),
    expectNonEmptyString(input.name, 'name', true),
    expectNonEmptyString(input.description, 'description', true),
    expectPositiveNumber(input.version, 'version', true),
    expectCompositionMany(input.tags, 'tags', isNonEmptyString, true)
  )

/** Validate WorkflowTaskCreate payloads. */
export const validateWorkflowTaskCreate = (input: WorkflowTaskCreate): ExpectResult =>
  expectValid(
    expectId(input.workflowId, 'workflowId'),
    expectId(input.taskId, 'taskId'),
    expectPositiveNumber(input.sequence, 'sequence')
  )

/** Validate WorkflowTaskUpdate payloads. */
export const validateWorkflowTaskUpdate = (input: WorkflowTaskUpdate): ExpectResult =>
  validateWorkflowTaskCreate(input)

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
