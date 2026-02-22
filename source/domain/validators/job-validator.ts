/**
 * Validators for job protocol inputs at system boundaries.
 * Returns an error message string on failure, null on success.
 */
import { isId, isWhen, isNonEmptyString } from '@core-std'
import type {
  JobCreateInput,
  JobUpdateInput,
  JobAssessmentCreateInput,
  JobAssessmentUpdateInput,
  JobWorkflowCreateInput,
  JobWorkflowUpdateInput,
  JobPlanCreateInput,
  JobPlanUpdateInput,
  JobWorkCreateInput,
  JobWorkLogEntryCreateInput,
} from '@domain/protocols/job-protocol.ts'

/** Validates input for creating a Job. */
export const validateJobCreate = (input: JobCreateInput): string | null => {
  if (!isId(input.customerId)) return 'customerId must be a valid Id'
  return null
}

/** Validates input for updating a Job. */
export const validateJobUpdate = (input: JobUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.status !== undefined && !isNonEmptyString(input.status)) return 'status must be a non-empty string'
  return null
}

/** Validates input for creating a JobAssessment. */
export const validateJobAssessmentCreate = (input: JobAssessmentCreateInput): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isId(input.assessorId)) return 'assessorId must be a valid Id'
  if (!input.locations || !Array.isArray(input.locations) || input.locations.length === 0) return 'locations must be a non-empty array'
  return null
}

/** Validates input for updating a JobAssessment. */
export const validateJobAssessmentUpdate = (input: JobAssessmentUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.locations !== undefined) {
    if (!Array.isArray(input.locations) || input.locations.length === 0) return 'locations must be a non-empty array'
  }
  return null
}

/** Validates input for creating a JobWorkflow. */
export const validateJobWorkflowCreate = (input: JobWorkflowCreateInput): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (typeof input.sequence !== 'number' || !Number.isInteger(input.sequence) || input.sequence < 0) return 'sequence must be a non-negative integer'
  if (!isId(input.basisWorkflowId)) return 'basisWorkflowId must be a valid Id'
  return null
}

/** Validates input for updating a JobWorkflow. */
export const validateJobWorkflowUpdate = (input: JobWorkflowUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.sequence !== undefined && (typeof input.sequence !== 'number' || !Number.isInteger(input.sequence) || input.sequence < 0)) return 'sequence must be a non-negative integer'
  if (input.modifiedWorkflowId !== undefined && !isId(input.modifiedWorkflowId)) return 'modifiedWorkflowId must be a valid Id'
  return null
}

/** Validates input for creating a JobPlan. */
export const validateJobPlanCreate = (input: JobPlanCreateInput): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isWhen(input.scheduledStart)) return 'scheduledStart must be a valid timestamp'
  return null
}

/** Validates input for updating a JobPlan. */
export const validateJobPlanUpdate = (input: JobPlanUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.scheduledStart !== undefined && !isWhen(input.scheduledStart)) return 'scheduledStart must be a valid timestamp'
  if (input.scheduledEnd !== undefined && !isWhen(input.scheduledEnd)) return 'scheduledEnd must be a valid timestamp'
  return null
}

/** Validates input for creating a JobWork. */
export const validateJobWorkCreate = (input: JobWorkCreateInput): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!input.work || !Array.isArray(input.work) || input.work.length === 0) return 'work must be a non-empty array of Ids'
  for (const workId of input.work) {
    if (!isId(workId)) return `work contains an invalid Id: ${workId}`
  }
  if (!isWhen(input.startedAt)) return 'startedAt must be a valid timestamp'
  if (!isId(input.startedById)) return 'startedById must be a valid Id'
  return null
}

/** Validates input for creating a JobWorkLogEntry; at least one of answer or metadata must be present. */
export const validateJobWorkLogEntryCreate = (input: JobWorkLogEntryCreateInput): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isId(input.userId)) return 'userId must be a valid Id'
  if (input.answer === undefined && input.metadata === undefined) return 'at least one of answer or metadata is required'
  return null
}
