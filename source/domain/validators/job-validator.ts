/**
 * Domain-level invariant validators for jobs.
 */

import type { JobStatus } from '../abstractions/job.ts'
import type {
  JobAssessmentInput,
  JobCreateInput,
  JobLogAppendInput,
  JobPlanInput
} from '../protocol/job-protocol.ts'
import { isNonEmptyString } from './helper-validator.ts'

/**
 * Type guard for job status.
 * @param value - Potential status value.
 * @returns True when the value matches a known status.
 */
export const isJobStatus = (value: unknown): value is JobStatus =>
  value === 'draft'
  || value === 'ready'
  || value === 'scheduled'
  || value === 'in-progress'
  || value === 'completed'
  || value === 'cancelled'

/** Input type for updating a job. */
export interface JobUpdateInput {
  id: string
  status?: JobStatus
}

/**
 * Validate job creation input.
 * @param input - Job creation input to validate.
 * @returns Error message or null if valid.
 */
export const validateJobCreateInput = (input?: JobCreateInput | null): string | null => {
  if (!input?.serviceId) return 'serviceId is required'
  if (!input.customerId) return 'customerId is required'
  return null
}

/**
 * Validate job assessment creation input.
 * @param input - Job assessment creation input to validate.
 * @returns Error message or null if valid.
 */
export const validateJobAssessmentCreateInput = (
  input?: JobAssessmentInput | null
): string | null => {
  if (!input) return 'Request body is required'
  if (!isNonEmptyString(input.jobId)) return 'jobId is required'
  if (!isNonEmptyString(input.assessorId)) return 'assessorId is required'
  if (!input.locations?.length) return 'locations requires 1+ location'
  return null
}

/**
 * Validate job plan creation input.
 * @param input - Job plan creation input to validate.
 * @returns Error message or null if valid.
 */
export const validateJobPlanCreateInput = (input?: JobPlanInput | null): string | null => {
  if (!input) return 'Request body is required'
  if (!isNonEmptyString(input.jobId)) return 'jobId is required'
  if (!isNonEmptyString(input.workflowId)) return 'workflowId is required'
  if (!input.scheduledStart) return 'scheduledStart is required'
  return null
}

/**
 * Validate job log append input.
 * @param input - Job log append input to validate.
 * @returns Error message or null if valid.
 */
export const validateJobLogAppendInput = (input?: JobLogAppendInput | null): string | null => {
  if (!input?.jobId) return 'jobId is required'
  if (!input.createdById) return 'createdById is required'
  if (!input.type) return 'type is required'
  if (!input.message) return 'message is required'
  return null
}

/**
 * Validate job update input.
 * @param input - Job update input to validate.
 * @returns Error message or null if valid.
 */
export const validateJobUpdate = (input?: JobUpdateInput | null): string | null => {
  if (!input) return 'Request body is required'
  if (!isNonEmptyString(input.id)) return 'id is required'
  if (input.status !== undefined && !isJobStatus(input.status)) {
    return 'status must be draft, ready, scheduled, in-progress, completed, or cancelled'
  }
  return null
}
