/**
 * Validators for Job domain boundary inputs.
 */

import { isId, isNonEmptyString, isPositiveNumber, isWhen } from '@core-std'
import type {
  JobAssessmentCreateInput,
  JobAssessmentUpdateInput,
  JobCreateInput,
  JobPlanCreateInput,
  JobPlanUpdateInput,
  JobUpdateInput,
  JobWorkCreateInput,
  JobWorkflowCreateInput,
  JobWorkflowUpdateInput,
  JobWorkLogEntryCreateInput
} from '@domain/protocols/job-protocol.ts'

/** Validate input for creating a Job; returns an error message or null. */
export const validateJobCreate = (input: JobCreateInput): string | null => {
  if (!isId(input.customerId)) return 'customerId must be a valid Id'
  if (!isNonEmptyString(input.status)) return 'status is required'
  return null
}

/** Validate input for updating a Job; returns an error message or null. */
export const validateJobUpdate = (input: JobUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.status !== undefined && !isNonEmptyString(input.status)) {
    return 'status must be a non-empty string'
  }
  return null
}

/** Validate input for creating a JobAssessment; returns an error message or null. */
export const validateJobAssessmentCreate = (
  input: JobAssessmentCreateInput
): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isId(input.assessorId)) return 'assessorId must be a valid Id'
  if (!input.locations || input.locations.length === 0) {
    return 'locations must contain at least one item'
  }
  return null
}

/** Validate input for updating a JobAssessment; returns an error message or null. */
export const validateJobAssessmentUpdate = (
  input: JobAssessmentUpdateInput
): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.locations !== undefined && input.locations.length === 0) {
    return 'locations must contain at least one item'
  }
  return null
}

/** Validate input for creating a JobWorkflow; returns an error message or null. */
export const validateJobWorkflowCreate = (input: JobWorkflowCreateInput): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isPositiveNumber(input.sequence)) return 'sequence must be a positive number'
  if (!isId(input.basisWorkflowId)) return 'basisWorkflowId must be a valid Id'
  return null
}

/** Validate input for updating a JobWorkflow; returns an error message or null. */
export const validateJobWorkflowUpdate = (input: JobWorkflowUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.sequence !== undefined && !isPositiveNumber(input.sequence)) {
    return 'sequence must be a positive number'
  }
  if (input.modifiedWorkflowId !== undefined && !isId(input.modifiedWorkflowId)) {
    return 'modifiedWorkflowId must be a valid Id'
  }
  return null
}

/** Validate input for creating a JobPlan; returns an error message or null. */
export const validateJobPlanCreate = (input: JobPlanCreateInput): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isWhen(input.scheduledStart)) return 'scheduledStart must be a valid timestamp'
  if (input.scheduledEnd !== undefined && !isWhen(input.scheduledEnd)) {
    return 'scheduledEnd must be a valid timestamp'
  }
  return null
}

/** Validate input for updating a JobPlan; returns an error message or null. */
export const validateJobPlanUpdate = (input: JobPlanUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.scheduledStart !== undefined && !isWhen(input.scheduledStart)) {
    return 'scheduledStart must be a valid timestamp'
  }
  if (input.scheduledEnd !== undefined && !isWhen(input.scheduledEnd)) {
    return 'scheduledEnd must be a valid timestamp'
  }
  return null
}

/** Validate input for creating a JobWork; returns an error message or null. */
export const validateJobWorkCreate = (input: JobWorkCreateInput): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!input.work || input.work.length === 0) {
    return 'work must contain at least one Workflow Id'
  }
  if (!isWhen(input.startedAt)) return 'startedAt must be a valid timestamp'
  if (!isId(input.startedById)) return 'startedById must be a valid Id'
  return null
}

/** Validate input for creating a JobWorkLogEntry; returns an error message or null. */
export const validateJobWorkLogEntryCreate = (
  input: JobWorkLogEntryCreateInput
): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isId(input.userId)) return 'userId must be a valid Id'
  if (input.answer === undefined && input.metadata === undefined) {
    return 'at least one of answer or metadata is required'
  }
  return null
}
