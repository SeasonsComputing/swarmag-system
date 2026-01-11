/**
 * Domain-level invariant validators for jobs.
 */

import type { JobAssessment, JobLogEntry, JobPlan, JobStatus } from '@domain/job.ts'

export type JobAssessmentInput = Omit<JobAssessment, 'id' | 'createdAt' | 'updatedAt'>

export type JobPlanInput =
  & Omit<
    JobPlan,
    'id' | 'jobId' | 'status' | 'createdAt' | 'updatedAt'
  >
  & { status?: JobStatus }

export type JobCreateInput = {
  serviceId: string
  customerId: string
  assessment: JobAssessmentInput
  plan: JobPlanInput
}

export type JobLogAppendInput = {
  jobId: JobLogEntry['jobId']
  planId: JobLogEntry['planId']
  type: JobLogEntry['type']
  message: string
  location?: JobLogEntry['location']
  attachments?: JobLogEntry['attachments']
  payload?: JobLogEntry['payload']
  createdBy: JobLogEntry['createdBy']
  occurredAt?: JobLogEntry['occurredAt']
}

export const validateJobCreateInput = (input?: JobCreateInput | null): string | null => {
  if (!input?.serviceId) return 'serviceId is required'
  if (!input.customerId) return 'customerId is required'
  if (!input.plan?.workflowId) return 'plan.workflowId is required'
  if (!input.plan?.scheduledStart) return 'plan.scheduledStart is required'
  if (!input.assessment?.assessedAt) return 'assessment.assessedAt is required'
  if (!input.assessment?.locations?.length) return 'assessment.locations requires 1+ location'
  return null
}

export const validateJobLogAppendInput = (input?: JobLogAppendInput | null): string | null => {
  if (!input?.jobId) return 'jobId is required'
  if (!input.planId) return 'planId is required'
  if (!input.createdBy) return 'createdBy is required'
  if (!input.type) return 'type is required'
  if (!input.message) return 'message is required'
  return null
}
