/**
 * Domain-level invariant validators for workflows.
 */

import type {
  WorkflowCreateInput,
  WorkflowUpdateInput
} from '@domain/protocols/workflow-protocol.ts'
import { isNonEmptyString } from './helper-validator.ts'

export type { WorkflowCreateInput, WorkflowUpdateInput }

/**
 * Validate workflow creation input.
 * @param input - Workflow creation input to validate.
 * @returns Error message or null if valid.
 */
export const validateWorkflowCreate = (input?: WorkflowCreateInput | null): string | null => {
  if (!input) return 'Request body is required'
  if (!isNonEmptyString(input.serviceId)) return 'serviceId is required'
  if (!isNonEmptyString(input.name)) return 'name is required'
  if (!Array.isArray(input.steps)) return 'steps must be an array'
  if (input.steps.length === 0) return 'steps must have at least one step'
  return null
}

/**
 * Validate workflow update input.
 * @param input - Workflow update input to validate.
 * @returns Error message or null if valid.
 */
export const validateWorkflowUpdate = (input?: WorkflowUpdateInput | null): string | null => {
  if (!input) return 'Request body is required'
  if (!isNonEmptyString(input.id)) return 'id is required'
  if (input.name !== undefined && !isNonEmptyString(input.name)) {
    return 'name cannot be empty'
  }
  if (input.steps !== undefined && !Array.isArray(input.steps)) {
    return 'steps must be an array'
  }
  if (input.steps !== undefined && input.steps.length === 0) {
    return 'steps must have at least one step'
  }
  return null
}
