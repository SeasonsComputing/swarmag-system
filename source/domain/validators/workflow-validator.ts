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
validateTaskCreate(input)  Validate TaskCreate payloads.
validateTaskUpdate(input)  Validate TaskUpdate payloads.
validateTaskQuestionCreate(input)  Validate TaskQuestionCreate payloads.
validateTaskQuestionUpdate(input)  Validate TaskQuestionUpdate payloads.
validateWorkflowCreate(input)  Validate WorkflowCreate payloads.
validateWorkflowUpdate(input)  Validate WorkflowUpdate payloads.
validateWorkflowTaskCreate(input)  Validate WorkflowTaskCreate payloads.
validateWorkflowTaskUpdate(input)  Validate WorkflowTaskUpdate payloads.
*/

import {
  expectCompositionMany,
  expectId,
  expectNonEmptyString,
  expectPositiveNumber,
  type ExpectResult,
  expectValid,
  isNonEmptyString
} from '@core/std'
import type {
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

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

export const validateTaskCreate = (input: TaskCreate): ExpectResult =>
  expectValid(
    expectCompositionMany(input.notes, 'notes', isNote),
    expectNonEmptyString(input.label, 'label'),
    expectNonEmptyString(input.description, 'description', true)
  )

export const validateTaskUpdate = (input: TaskUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectCompositionMany(input.notes, 'notes', isNote, true),
    expectNonEmptyString(input.label, 'label', true),
    expectNonEmptyString(input.description, 'description', true)
  )

export const validateTaskQuestionCreate = (input: TaskQuestionCreate): ExpectResult =>
  expectValid(
    expectId(input.taskId, 'taskId'),
    expectId(input.questionId, 'questionId'),
    expectPositiveNumber(input.sequence, 'sequence')
  )

export const validateTaskQuestionUpdate = (input: TaskQuestionUpdate): ExpectResult =>
  validateTaskQuestionCreate(input)

export const validateWorkflowCreate = (input: WorkflowCreate): ExpectResult =>
  expectValid(
    expectCompositionMany(input.notes, 'notes', isNote),
    expectNonEmptyString(input.name, 'name'),
    expectNonEmptyString(input.description, 'description', true),
    expectPositiveNumber(input.version, 'version'),
    expectCompositionMany(input.tags, 'tags', isNonEmptyString)
  )

export const validateWorkflowUpdate = (input: WorkflowUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectCompositionMany(input.notes, 'notes', isNote, true),
    expectNonEmptyString(input.name, 'name', true),
    expectNonEmptyString(input.description, 'description', true),
    expectPositiveNumber(input.version, 'version', true),
    expectCompositionMany(input.tags, 'tags', isNonEmptyString, true)
  )

export const validateWorkflowTaskCreate = (input: WorkflowTaskCreate): ExpectResult =>
  expectValid(
    expectId(input.workflowId, 'workflowId'),
    expectId(input.taskId, 'taskId'),
    expectPositiveNumber(input.sequence, 'sequence')
  )

export const validateWorkflowTaskUpdate = (input: WorkflowTaskUpdate): ExpectResult =>
  validateWorkflowTaskCreate(input)
