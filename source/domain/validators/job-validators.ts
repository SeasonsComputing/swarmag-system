/**
 * Domain-level invariant validators for jobs.
 */

import type { JobCreateInput, JobLogAppendInput } from '@domain/protocol/job-protocol.ts'

/**
 * Validate job creation input.
 * @param input - Job creation input to validate.
 * @returns Error message or null if valid.
 */
export const validateJobCreateInput = (input?: JobCreateInput | null): string | null => {
  if (!input?.serviceId) return 'serviceId is required'
  if (!input.customerId) return 'customerId is required'
  if (!input.plan?.workflowId) return 'plan.workflowId is required'
  if (!input.plan?.scheduledStart) return 'plan.scheduledStart is required'
  if (!input.assessment?.assessedAt) return 'assessment.assessedAt is required'
  if (!input.assessment?.locations?.length) return 'assessment.locations requires 1+ location'
  return null
}

/**
 * Validate job log append input.
 * @param input - Job log append input to validate.
 * @returns Error message or null if valid.
 */
export const validateJobLogAppendInput = (input?: JobLogAppendInput | null): string | null => {
  if (!input?.jobId) return 'jobId is required'
  if (!input.planId) return 'planId is required'
  if (!input.createdBy) return 'createdBy is required'
  if (!input.type) return 'type is required'
  if (!input.message) return 'message is required'
  return null
}
