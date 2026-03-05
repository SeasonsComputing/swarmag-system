/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Workflow protocol validator                                                ║
║ Boundary validation for workflow protocol payloads.                        ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for workflow topic abstractions.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
validateTaskCreate(input)
  Validate TaskCreate payloads.

validateTaskUpdate(input)
  Validate TaskUpdate payloads.

validateWorkflowCreate(input)
  Validate WorkflowCreate payloads.

validateWorkflowUpdate(input)
  Validate WorkflowUpdate payloads.
*/

import {
  isCompositionMany,
  isId,
  isNonEmptyString,
  isPositiveNumber
} from '@core-std'
import type {
  TaskCreate,
  TaskUpdate,
  WorkflowCreate,
  WorkflowUpdate
} from '@domain/protocols/workflow-protocol.ts'
import { isNote } from '@domain/validators/common-validator.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates TaskCreate; returns error message or null. */
export const validateTaskCreate = (input: TaskCreate): string | null => {
  if (!isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  if (!isNonEmptyString(input.label)) return 'label must be a non-empty string'
  if (input.description !== undefined && !isNonEmptyString(input.description)) {
    return 'description must be a non-empty string when provided'
  }
  return null
}

/** Validates TaskUpdate; returns error message or null. */
export const validateTaskUpdate = (input: TaskUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'

  if (input.notes !== undefined && !isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values when provided'
  }
  if (input.label !== undefined && !isNonEmptyString(input.label)) {
    return 'label must be a non-empty string when provided'
  }
  if (input.description !== undefined && !isNonEmptyString(input.description)) {
    return 'description must be a non-empty string when provided'
  }
  return null
}

/** Validates WorkflowCreate; returns error message or null. */
export const validateWorkflowCreate = (input: WorkflowCreate): string | null => {
  if (!isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  if (!isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (input.description !== undefined && !isNonEmptyString(input.description)) {
    return 'description must be a non-empty string when provided'
  }
  if (!isPositiveNumber(input.version)) return 'version must be a positive number'
  if (
    !isCompositionMany(input.tags, (entry): entry is string => isNonEmptyString(entry))
  ) {
    return 'tags must be an array of non-empty strings'
  }
  return null
}

/** Validates WorkflowUpdate; returns error message or null. */
export const validateWorkflowUpdate = (input: WorkflowUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'

  if (input.notes !== undefined && !isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values when provided'
  }
  if (input.name !== undefined && !isNonEmptyString(input.name)) {
    return 'name must be a non-empty string when provided'
  }
  if (input.description !== undefined && !isNonEmptyString(input.description)) {
    return 'description must be a non-empty string when provided'
  }
  if (input.version !== undefined && !isPositiveNumber(input.version)) {
    return 'version must be a positive number when provided'
  }
  if (
    input.tags !== undefined
    && !isCompositionMany(input.tags, (entry): entry is string => isNonEmptyString(entry))
  ) {
    return 'tags must be an array of non-empty strings when provided'
  }
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ────────────────────────────────────────────────────────────────────────────
