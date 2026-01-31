/**
 * Protocol types for job operations.
 * Defines wire shapes for request/response contracts.
 */

import type { JobAssessment, JobLogEntry, JobPlan, JobStatus } from '@domain/abstractions/job.ts'

/** Input for creating a job assessment. */
export type JobAssessmentInput = Omit<JobAssessment, 'id' | 'createdAt' | 'updatedAt'>

/** Input for creating a job plan. */
export type JobPlanInput =
  & Omit<
    JobPlan,
    'id' | 'jobId' | 'status' | 'createdAt' | 'updatedAt'
  >
  & { status?: JobStatus }

/** Input for creating a job with assessment and plan. */
export type JobCreateInput = {
  serviceId: string
  customerId: string
  assessment: JobAssessmentInput
  plan: JobPlanInput
}

/** Input for appending to a job log. */
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
