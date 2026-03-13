/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Workflow domain validator                                                    ║
║ Boundary validation for workflow topic abstractions.                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for Task, Workflow, and their
junction types (TaskQuestion, WorkflowTask). Junction types have create
validators only.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateTaskCreate          Validate TaskCreate payloads.
validateTaskUpdate          Validate TaskUpdate payloads.
validateTaskQuestionCreate  Validate TaskQuestionCreate payloads.
validateWorkflowCreate      Validate WorkflowCreate payloads.
validateWorkflowUpdate      Validate WorkflowUpdate payloads.
validateWorkflowTaskCreate  Validate WorkflowTaskCreate payloads.
*/

import {
  expectCompositionMany,
  type ExpectGuard,
  expectId,
  expectNonEmptyString,
  expectPositiveNumber,
  type ExpectResult,
  expectValid
} from '@core/std'
import type { Note } from '@domain/abstractions/common.ts'
import type {
  TaskCreate,
  TaskQuestionCreate,
  TaskUpdate,
  WorkflowCreate,
  WorkflowTaskCreate,
  WorkflowUpdate
} from '@domain/protocols/workflow-protocol.ts'
import { isNote } from '@domain/validators/common-validator.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validate TaskCreate payloads. */
export const validateTaskCreate = (input: TaskCreate): ExpectResult =>
  expectValid(
    expectCompositionMany(input.notes, 'notes', isNote as ExpectGuard<Note>, true),
    expectNonEmptyString(input.label, 'label'),
    expectNonEmptyString(input.description, 'description', true)
  )

/** Validate TaskUpdate payloads. */
export const validateTaskUpdate = (input: TaskUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectCompositionMany(input.notes, 'notes', isNote as ExpectGuard<Note>, true),
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

/** Validate WorkflowCreate payloads. */
export const validateWorkflowCreate = (input: WorkflowCreate): ExpectResult =>
  expectValid(
    expectCompositionMany(input.notes, 'notes', isNote as ExpectGuard<Note>, true),
    expectNonEmptyString(input.name, 'name'),
    expectNonEmptyString(input.description, 'description', true),
    expectPositiveNumber(input.version, 'version'),
    expectCompositionMany(input.tags, 'tags', isString, true)
  )

/** Validate WorkflowUpdate payloads. */
export const validateWorkflowUpdate = (input: WorkflowUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectCompositionMany(input.notes, 'notes', isNote as ExpectGuard<Note>, true),
    expectNonEmptyString(input.name, 'name', true),
    expectNonEmptyString(input.description, 'description', true),
    expectPositiveNumber(input.version, 'version', true),
    expectCompositionMany(input.tags, 'tags', isString, true)
  )

/** Validate WorkflowTaskCreate payloads. */
export const validateWorkflowTaskCreate = (input: WorkflowTaskCreate): ExpectResult =>
  expectValid(
    expectId(input.workflowId, 'workflowId'),
    expectId(input.taskId, 'taskId'),
    expectPositiveNumber(input.sequence, 'sequence')
  )

// ────────────────────────────────────────────────────────────────────────────
// GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isString: ExpectGuard<string> = (v): v is string => typeof v === 'string'
