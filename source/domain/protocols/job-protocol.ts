/**
 * Protocol input shapes for Job and all job lifecycle artifact create and update operations.
 * Partial shapes for boundary transmission — no domain logic.
 */

import type { Id, When, Dictionary } from '@core-std'
import type { JobStatus, JobPlanChemical, JobPlanAsset, JobPlanAssignment } from '@domain/abstractions/job.ts'
import type { Answer } from '@domain/abstractions/workflow.ts'
import type { Location, Note } from '@domain/abstractions/common.ts'

/** Input shape for creating a Job. */
export type JobCreateInput = {
  customerId: Id
  status?: JobStatus
}

/** Input shape for updating a Job. */
export type JobUpdateInput = {
  id: Id
  status?: JobStatus
}

/** Input shape for creating a JobAssessment. */
export type JobAssessmentCreateInput = {
  jobId: Id
  assessorId: Id
  locations: [Location, ...Location[]]
  risks?: [Note?, ...Note[]]
  notes?: [Note?, ...Note[]]
}

/** Input shape for updating a JobAssessment. */
export type JobAssessmentUpdateInput = {
  id: Id
  locations?: [Location, ...Location[]]
  risks?: [Note?, ...Note[]]
  notes?: [Note?, ...Note[]]
}

/** Input shape for creating a JobWorkflow. */
export type JobWorkflowCreateInput = {
  jobId: Id
  sequence: number
  basisWorkflowId: Id
  modifiedWorkflowId?: Id
}

/** Input shape for updating a JobWorkflow. */
export type JobWorkflowUpdateInput = {
  id: Id
  sequence?: number
  modifiedWorkflowId?: Id
}

/** Input shape for creating a JobPlan. */
export type JobPlanCreateInput = {
  jobId: Id
  scheduledStart: When
  scheduledEnd?: When
  notes?: [Note?, ...Note[]]
}

/** Input shape for updating a JobPlan. */
export type JobPlanUpdateInput = {
  id: Id
  scheduledStart?: When
  scheduledEnd?: When
  notes?: [Note?, ...Note[]]
}

/** Input shape for creating a JobWork. */
export type JobWorkCreateInput = {
  jobId: Id
  work: [Id, ...Id[]]
  startedAt: When
  startedById: Id
}

/** Input shape for creating a JobWorkLogEntry; at least one of answer or metadata is required. */
export type JobWorkLogEntryCreateInput = {
  jobId: Id
  userId: Id
  answer?: Answer
  metadata?: Dictionary
}
