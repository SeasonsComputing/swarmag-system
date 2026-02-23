/**
 * Validators for Workflow boundary inputs.
 */

import { isNonEmptyString, isPositiveNumber } from '@core-std'
import type {
  WorkflowCreateInput,
  WorkflowUpdateInput
} from '@domain/protocols/workflow-protocol.ts'

/** Validate input for creating a Workflow; returns an error message or null. */
export const validateWorkflowCreate = (input: WorkflowCreateInput): string | null => {
  if (!isNonEmptyString(input.name)) return 'name is required'
  if (!isPositiveNumber(input.version)) return 'version must be a positive number'
  if (!input.tasks || input.tasks.length === 0) return 'tasks must contain at least one item'
  return null
}

/** Validate input for updating a Workflow; returns an error message or null. */
export const validateWorkflowUpdate = (input: WorkflowUpdateInput): string | null => {
  if (!isNonEmptyString(input.id)) return 'id is required'
  if (input.name !== undefined && !isNonEmptyString(input.name)) {
    return 'name must be a non-empty string'
  }
  if (input.version !== undefined && !isPositiveNumber(input.version)) {
    return 'version must be a positive number'
  }
  if (input.tasks !== undefined && input.tasks.length === 0) {
    return 'tasks must contain at least one item'
  }
  return null
}
