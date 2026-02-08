/**
 * Protocol types for job operations.
 * Defines wire shapes for request/response contracts.
 */

import type { JobAssessment, JobLogEntry, JobPlan } from '@domain/abstractions/job.ts'

/** Input for creating a job assessment. */
export type JobAssessmentInput = Omit<JobAssessment, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>

/** Input for creating a job plan. */
export type JobPlanInput = Omit<JobPlan, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>

/** Input for creating a job. */
export type JobCreateInput = {
  serviceId: string
  customerId: string
}

/** Input for appending to a job log. */
export type JobLogAppendInput = {
  jobId: JobLogEntry['jobId']
  type: JobLogEntry['type']
  message: string
  location?: JobLogEntry['location']
  attachments?: JobLogEntry['attachments']
  payload?: JobLogEntry['payload']
  createdById: JobLogEntry['createdById']
  occurredAt?: JobLogEntry['occurredAt']
}
