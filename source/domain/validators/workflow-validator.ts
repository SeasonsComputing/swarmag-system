/**
 * Workflow protocol validators.
 */

import {
  isCompositionMany,
  isCompositionPositive,
  isId,
  isNonEmptyString,
  isPositiveNumber
} from '@core-std'
import type { Dictionary } from '@core-std'
import type { Question, QuestionOption, Task } from '@domain/abstractions/workflow.ts'
import { QUESTION_TYPES } from '@domain/abstractions/workflow.ts'
import type { WorkflowCreate } from '@domain/protocols/workflow-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates WorkflowCreate; returns error message or null. */
export const validateWorkflowCreate = (input: WorkflowCreate): string | null => {
  if (!isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (!isPositiveNumber(input.version)) return 'version must be a positive number'
  if (!isCompositionPositive(input.tasks, isTask)) {
    return 'tasks must be a non-empty array of valid tasks'
  }
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATOR DECOMPOSITION
// ────────────────────────────────────────────────────────────────────────────

const isQuestionOption = (v: unknown): v is QuestionOption => {
  if (!v || typeof v !== 'object') return false
  const o = v as Dictionary
  return isNonEmptyString(o.value as unknown)
}

const isQuestion = (v: unknown): v is Question => {
  if (!v || typeof v !== 'object') return false
  const q = v as Dictionary
  return isId(q.id as unknown)
    && isNonEmptyString(q.prompt as unknown)
    && QUESTION_TYPES.includes(q.type as Question['type'])
    && isCompositionMany(q.options, isQuestionOption)
}

const isTask = (v: unknown): v is Task => {
  if (!v || typeof v !== 'object') return false
  const t = v as Dictionary
  return isId(t.id as unknown)
    && isNonEmptyString(t.title as unknown)
    && isCompositionPositive(t.checklist, isQuestion)
}
