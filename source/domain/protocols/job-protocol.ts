/**
 * Protocol input shapes for Job boundary operations.
 */

import type { Id, When } from '@core-std'
import type { Answer } from '@domain/abstractions/workflow.ts'
import type { Location } from '@domain/abstractions/common.ts'
import type { UserRole } from '@domain/abstractions/user.ts'
import type { ChemicalUnit, JobPlanChemical, JobStatus } from '@domain/abstractions/job.ts'

/** Input for creating a Job. */
export type JobCreate = {
  customerId: Id
}

/** Input for updating a Job. */
export type JobUpdate = {
  id: Id
  status?: JobStatus
}

/** Input for creating a JobAssessment. */
export type JobAssessmentCreate = {
  jobId: Id
  assessorId: Id
  locations: Location[]
}

/** Input for updating a JobAssessment. */
export type JobAssessmentUpdate = {
  id: Id
  assessorId?: Id
  locations?: Location[]
}

/** Input for creating a JobWorkflow. */
export type JobWorkflowCreate = {
  jobId: Id
  sequence: number
  basisWorkflowId: Id
  modifiedWorkflowId?: Id
}

/** Input for updating a JobWorkflow. */
export type JobWorkflowUpdate = {
  id: Id
  sequence?: number
  modifiedWorkflowId?: Id
}

/** Input for creating a JobPlan. */
export type JobPlanCreate = {
  jobId: Id
  scheduledStart: When
  scheduledEnd?: When
}

/** Input for updating a JobPlan. */
export type JobPlanUpdate = {
  id: Id
  scheduledStart?: When
  scheduledEnd?: When
}

/** Input for creating a JobPlanAssignment. */
export type JobPlanAssignmentCreate = {
  planId: Id
  userId: Id
  role: UserRole
}

/** Input for updating a JobPlanAssignment. */
export type JobPlanAssignmentUpdate = {
  id: Id
  role?: UserRole
}

/** Input for creating a JobPlanChemical. */
export type JobPlanChemicalCreate = {
  planId: Id
  chemicalId: Id
  amount: number
  unit: ChemicalUnit
  targetArea?: number
  targetAreaUnit?: JobPlanChemical['targetAreaUnit']
}

/** Input for updating a JobPlanChemical. */
export type JobPlanChemicalUpdate = {
  id: Id
  amount?: number
  unit?: ChemicalUnit
  targetArea?: number
  targetAreaUnit?: JobPlanChemical['targetAreaUnit']
}

/** Input for creating a JobPlanAsset junction. */
export type JobPlanAssetCreate = {
  planId: Id
  assetId: Id
}

/** Input for creating a JobWork record. */
export type JobWorkCreate = {
  jobId: Id
  work: Id[]
  startedAt: When
  startedById: Id
}

/** Input for creating a JobWorkLogEntry. */
export type JobWorkLogEntryCreate = {
  jobId: Id
  userId: Id
  answer: Answer
}
