/**
 * Domain abstractions for jobs in the swarmAg system.
 * Job is the lifecycle anchor for all field work agreements.
 */

import type { Id, When } from '@core-std'
import type { Dictionary } from '@core-std'
import type { Location, Note } from '@domain/abstractions/common.ts'
import type { Answer } from '@domain/abstractions/workflow.ts'

/** Job lifecycle state. */
export type JobStatus =
  | 'open'
  | 'assessing'
  | 'planning'
  | 'preparing'
  | 'executing'
  | 'finalizing'
  | 'closed'
  | 'cancelled'

/** Work agreement lifecycle anchor. */
export type Job = {
  id: Id
  customerId: Id
  status: JobStatus
  createdAt: When
  updatedAt: When
  deletedAt?: When
}

/** Pre-planning assessment; requires one or more locations. */
export type JobAssessment = {
  id: Id
  jobId: Id
  assessorId: Id
  locations: [Location, ...Location[]]
  risks: [Note?, ...Note[]]
  notes: [Note?, ...Note[]]
  createdAt: When
  updatedAt: When
  deletedAt?: When
}

/**
 * Job-specific workflow instance.
 * basisWorkflowId references the read-only Workflow master.
 * modifiedWorkflowId is always a clone, created only when specialization is required.
 */
export type JobWorkflow = {
  id: Id
  jobId: Id
  sequence: number
  basisWorkflowId: Id
  modifiedWorkflowId?: Id
  createdAt: When
  updatedAt: When
  deletedAt?: When
}

/** Assignment of user to plan role. */
export type JobPlanAssignment = {
  planId: Id
  userId: Id
  role: string
  notes: [Note?, ...Note[]]
  deletedAt?: When
}

/** Planned chemical usage. */
export type JobPlanChemical = {
  planId: Id
  chemicalId: Id
  amount: number
  unit: 'gallon' | 'liter' | 'pound' | 'kilogram'
  targetArea?: number
  targetAreaUnit?: 'acre' | 'hectare'
  deletedAt?: When
}

/** Asset allocated to a plan. */
export type JobPlanAsset = {
  planId: Id
  assetId: Id
  deletedAt?: When
}

/** Job-specific execution plan. */
export type JobPlan = {
  id: Id
  jobId: Id
  scheduledStart: When
  scheduledEnd?: When
  notes: [Note?, ...Note[]]
  createdAt: When
  updatedAt: When
  deletedAt?: When
}

/**
 * Execution record.
 * work is the ordered array of resolved Workflow IDs — the immutable execution manifest.
 * Creation transitions Job to executing.
 */
export type JobWork = {
  id: Id
  jobId: Id
  work: [Id, ...Id[]]
  startedAt: When
  startedById: Id
  completedAt?: When
  createdAt: When
  updatedAt: When
  deletedAt?: When
}

/**
 * Append-only execution event.
 * At least one of answer or metadata must be present.
 */
export type JobWorkLogEntry =
  & {
    id: Id
    jobId: Id
    userId: Id
    createdAt: When
  }
  & (
    | { answer: Answer; metadata?: Dictionary }
    | { answer?: Answer; metadata: Dictionary }
  )
