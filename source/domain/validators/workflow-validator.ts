/**
 * Validators for the workflow domain area: Task and Workflow create and update.
 * No WorkflowUpdate — Workflow is a read-only master.
 */

import type { Dictionary } from '@core-std'
import {
  isCompositionMany,
  isId,
  isNonEmptyString,
  isPositiveNumber,
  isWhen
} from '@core-std'
import type {
  TaskCreate,
  TaskUpdate,
  WorkflowCreate
} from '@domain/protocols/workflow-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates TaskCreate; returns error message or null. */
export const validateTaskCreate = (input: TaskCreate): string | null => {
  if (!isNonEmptyString(input.title)) return 'title must be a non-empty string'
  if (!isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

/** Validates TaskUpdate; returns error message or null. */
export const validateTaskUpdate = (input: TaskUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid UUID'
  if (input.title !== undefined && !isNonEmptyString(input.title)) {
    return 'title must be a non-empty string'
  }
  if (input.notes !== undefined && !isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

/** Validates WorkflowCreate; returns error message or null. */
export const validateWorkflowCreate = (input: WorkflowCreate): string | null => {
  if (!isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (!isPositiveNumber(input.version)) return 'version must be a positive number'
  if (!isCompositionMany(input.tags, (t): t is string => typeof t === 'string')) {
    return 'tags must be an array of strings'
  }
  if (!isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATOR GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isNote = (v: unknown): v is Dictionary => {
  const d = v as Dictionary
  return isNonEmptyString(d.content) && isWhen(d.createdAt)
    && Array.isArray(d.attachments)
}
