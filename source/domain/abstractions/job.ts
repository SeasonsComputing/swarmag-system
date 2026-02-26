/**
 * Domain models for jobs in the swarmAg system.
 * Job is the lifecycle anchor for all work agreed to with a customer.
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
export const JOB_STATUSES = [
  'open',
  'assessing',
  'planning',
  'preparing',
  'executing',
  'finalizing',
  'closed',
  'cancelled'
] as const
export type JobStatus = (typeof JOB_STATUSES)[number]

/** Planned chemical quantity units. */
export const CHEMICAL_UNITS = ['gallon', 'liter', 'pound', 'kilogram'] as const
export type ChemicalUnit = (typeof CHEMICAL_UNITS)[number]

/** Pre-planning assessment; requires one or more locations. */
export type JobAssessment = Instantiable & {
  jobId: AssociationOne<Job>
  assessorId: AssociationOne<User>
  locations: CompositionPositive<Location>
  risks: CompositionMany<Note>
  notes: CompositionMany<Note>
}

/** Job-specific workflow instance; modifiedWorkflowId is always a clone of the basis. */
export type JobWorkflow = Instantiable & {
  jobId: AssociationOne<Job>
  sequence: number
  basisWorkflowId: AssociationOne<Workflow>
  modifiedWorkflowId: AssociationOptional<Workflow>
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
  unit: ChemicalUnit
  targetArea?: number
  targetAreaUnit?: 'acre' | 'hectare'
}

/** m:m junction — plans to assets; hard delete only. */
export type JobPlanAsset = {
  planId: AssociationJunction<JobPlan>
  assetId: AssociationJunction<Asset>
}

/** Job-specific execution plan. */
export type JobPlan = Instantiable & {
  jobId: AssociationOne<Job>
  scheduledStart: When
  scheduledEnd?: When
  notes: CompositionMany<Note>
}

/** Execution record; work is the immutable ordered execution manifest. */
export type JobWork = Instantiable & {
  jobId: AssociationOne<Job>
  work: CompositionPositive<Id>
  startedAt: When
  startedById: AssociationOne<User>
  completedAt?: When
}

/** Append-only execution event; answer captures both crew responses and system telemetry. */
export type JobWorkLogEntry = Pick<Instantiable, 'id' | 'createdAt'> & {
  jobId: AssociationOne<Job>
  userId: AssociationOne<User>
  answer: CompositionOne<Answer>
}

/** Work agreement lifecycle anchor. */
export type Job = Instantiable & {
  customerId: AssociationOne<Customer>
  status: JobStatus
}
