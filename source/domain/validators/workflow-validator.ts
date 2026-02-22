/**
 * Validators for workflow protocol inputs at system boundaries.
 * Returns an error message string on failure, null on success.
 */
import { isNonEmptyString, isId, isPositiveNumber } from '@core-std'
import type { WorkflowCreateInput, WorkflowUpdateInput } from '@domain/protocols/workflow-protocol.ts'

/** Validates input for creating a Workflow. */
export const validateWorkflowCreate = (input: WorkflowCreateInput): string | null => {
  if (!isNonEmptyString(input.name)) return 'name is required'
  if (!isPositiveNumber(input.version)) return 'version must be a positive number'
  if (!input.tasks || !Array.isArray(input.tasks) || input.tasks.length === 0) return 'tasks must be a non-empty array'
  return null
}

/** Validates input for updating a Workflow. */
export const validateWorkflowUpdate = (input: WorkflowUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.name !== undefined && !isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (input.version !== undefined && !isPositiveNumber(input.version)) return 'version must be a positive number'
  if (input.tasks !== undefined) {
    if (!Array.isArray(input.tasks) || input.tasks.length === 0) return 'tasks must be a non-empty array'
  }
  return null
}
