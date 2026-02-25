/**
 * Domain models for jobs in the swarmAg system.
 * A Job is the lifecycle anchor for a unit of work agreed to with a customer.
 * It is assessed (JobAssessment), planned (JobPlan), and executed (JobWork).
 * JobWorkflow instances sequence the workflows that guide each phase.
 * JobWorkLogEntry is the append-only record of execution events.
 */

import type {
  AssociationJunction,
  AssociationOne,
  AssociationOptional,
  CompositionMany,
  CompositionOne,
  CompositionPositive,
  Id,
  Instantiable,
  When
} from '@core-std'
import type { Asset } from '@domain/abstractions/asset.ts'
import type { Chemical } from '@domain/abstractions/chemical.ts'
import type { Location, Note } from '@domain/abstractions/common.ts'
import type { Customer } from '@domain/abstractions/customer.ts'
import type { User, UserRole } from '@domain/abstractions/user.ts'
import type { Workflow } from '@domain/abstractions/workflow.ts'
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
export type Job = Instantiable & {
  customerId: AssociationOne<Customer>
  status: JobStatus
}

/**
 * Pre-planning assessment; requires one or more locations.
 * risks carries risk notes; notes carries general assessment notes.
 */
export type JobAssessment = Instantiable & {
  jobId: AssociationOne<Job>
  assessorId: AssociationOne<User>
  locations: CompositionPositive<Location>
  risks: CompositionMany<Note>
  notes: CompositionMany<Note>
}

/**
 * Job-specific workflow instance.
 * basisWorkflowId references the read-only Workflow master.
 * modifiedWorkflowId is always a clone of the basis, created only when
 * specialization is required during assessment or planning.
 */
export type JobWorkflow = Instantiable & {
  jobId: AssociationOne<Job>
  sequence: number
  basisWorkflowId: AssociationOne<Workflow>
  modifiedWorkflowId: AssociationOptional<Workflow>
}

/** Job-specific execution plan. */
export type JobPlan = Instantiable & {
  jobId: AssociationOne<Job>
  scheduledStart: When
  scheduledEnd?: When
  notes: CompositionMany<Note>
}

/** Assignment of user to plan role; many side of 1:m with JobPlan. */
export type JobPlanAssignment = Instantiable & {
  planId: AssociationOne<JobPlan>
  userId: AssociationOne<User>
  role: UserRole
  notes: CompositionMany<Note>
}

/** Planned chemical usage; many side of 1:m with JobPlan. */
export type JobPlanChemical = Instantiable & {
  planId: AssociationOne<JobPlan>
  chemicalId: AssociationOne<Chemical>
  amount: number
  unit: 'gallon' | 'liter' | 'pound' | 'kilogram'
  targetArea?: number
  targetAreaUnit?: 'acre' | 'hectare'
}

/** m:m junction — plans to assets; hard delete only. */
export type JobPlanAsset = {
  planId: AssociationJunction<JobPlan>
  assetId: AssociationJunction<Asset>
}

/**
 * Execution record.
 * Creation transitions the Job to executing.
 * work is an ordered array of resolved Workflow IDs — the immutable execution manifest.
 */
export type JobWork = Instantiable & {
  jobId: AssociationOne<Job>
  work: CompositionPositive<Id>
  startedAt: When
  startedById: AssociationOne<User>
  completedAt?: When
}

/**
 * Append-only execution event.
 * answer is always present and captures both crew checklist responses and
 * system-generated telemetry via the internal question type.
 */
export type JobWorkLogEntry = {
  id: Id
  jobId: AssociationOne<Job>
  userId: AssociationOne<User>
  answer: CompositionOne<Answer>
  createdAt: When
}
