/**
 * Protocol input shapes for Job boundary operations.
 */

import type { Id, When } from '@core-std'
import type { Location } from '@domain/abstractions/common.ts'
import type { JobStatus } from '@domain/abstractions/job.ts'
import type { UserRole } from '@domain/abstractions/user.ts'
import type { Answer } from '@domain/abstractions/workflow.ts'

/** Input for creating a Job. */
export type JobCreateInput = {
  customerId: Id
}

/** Input for updating a Job. */
export type JobUpdateInput = {
  id: Id
  status?: JobStatus
}

/** Input for creating a JobAssessment. */
export type JobAssessmentCreateInput = {
  jobId: Id
  assessorId: Id
  locations: Location[]
}

/** Input for updating a JobAssessment. */
export type JobAssessmentUpdateInput = {
  id: Id
  assessorId?: Id
  locations?: Location[]
}

/** Input for creating a JobWorkflow. */
export type JobWorkflowCreateInput = {
  jobId: Id
  sequence: number
  basisWorkflowId: Id
  modifiedWorkflowId?: Id
}

/** Input for updating a JobWorkflow. */
export type JobWorkflowUpdateInput = {
  id: Id
  sequence?: number
  modifiedWorkflowId?: Id
}

/** Input for creating a JobPlan. */
export type JobPlanCreateInput = {
  jobId: Id
  scheduledStart: When
  scheduledEnd?: When
}

/** Input for updating a JobPlan. */
export type JobPlanUpdateInput = {
  id: Id
  scheduledStart?: When
  scheduledEnd?: When
}

/** Input for creating a JobPlanAssignment. */
export type JobPlanAssignmentCreateInput = {
  planId: Id
  userId: Id
  role: UserRole
}

/** Input for updating a JobPlanAssignment. */
export type JobPlanAssignmentUpdateInput = {
  id: Id
  role?: UserRole
}

/** Input for creating a JobPlanChemical. */
export type JobPlanChemicalCreateInput = {
  planId: Id
  chemicalId: Id
  amount: number
  unit: 'gallon' | 'liter' | 'pound' | 'kilogram'
  targetArea?: number
  targetAreaUnit?: 'acre' | 'hectare'
}

/** Input for updating a JobPlanChemical. */
export type JobPlanChemicalUpdateInput = {
  id: Id
  amount?: number
  unit?: 'gallon' | 'liter' | 'pound' | 'kilogram'
  targetArea?: number
  targetAreaUnit?: 'acre' | 'hectare'
}

/** Input for creating a JobPlanAsset junction. */
export type JobPlanAssetCreateInput = {
  planId: Id
  assetId: Id
}

/** Input for creating a JobWork record. */
export type JobWorkCreateInput = {
  jobId: Id
  work: Id[]
  startedAt: When
  startedById: Id
}

/** Input for creating a JobWorkLogEntry. */
export type JobWorkLogEntryCreateInput = {
  jobId: Id
  userId: Id
  answer: Answer
}
