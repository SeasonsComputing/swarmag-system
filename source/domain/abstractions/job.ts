/**
 * Job domain abstractions.
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
  InstantiableOnly,
  When
} from '@core-std'
import type { Asset } from '@domain/abstractions/asset.ts'
import type { Chemical } from '@domain/abstractions/chemical.ts'
import type { Answer, Location, Note } from '@domain/abstractions/common.ts'
import type { Customer } from '@domain/abstractions/customer.ts'
import type { User, UserRole } from '@domain/abstractions/user.ts'
import type { Workflow } from '@domain/abstractions/workflow.ts'

/** Job lifecycle status. */
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

/** Work agreement lifecycle anchor. */
export type Job = Instantiable & {
  customerId: AssociationOne<Customer>
  status: JobStatus
}

/** Pre-planning assessment for a job. */
export type JobAssessment = Instantiable & {
  jobId: AssociationOne<Job>
  assessorId: AssociationOne<User>
  locations: CompositionPositive<Location>
  risks: CompositionMany<Note>
  notes: CompositionMany<Note>
}

/** Job-specific workflow binding and specialization pointer. */
export type JobWorkflow = Instantiable & {
  jobId: AssociationOne<Job>
  basisWorkflowId: AssociationOne<Workflow>
  modifiedWorkflowId: AssociationOptional<Workflow>
}

/** Job-specific execution plan. */
export type JobPlan = Instantiable & {
  jobId: AssociationOne<Job>
  plannerId: AssociationOne<User>
  notes: CompositionMany<Note>
  scheduledStart: When
  scheduledEnd?: When
}

/** Assignment of a user to a planned role. */
export type JobPlanAssignment = Instantiable & {
  planId: AssociationOne<JobPlan>
  crewMemberId: AssociationOne<User>
  notes: CompositionMany<Note>
  role: UserRole
}

/** Supported units for planned chemical quantity. */
export const JOB_PLAN_CHEMICAL_UNITS = ['gallon', 'liter', 'pound', 'kilogram'] as const
export type JobPlanChemicalUnit = (typeof JOB_PLAN_CHEMICAL_UNITS)[number]

/** Supported units for planned target area. */
export const JOB_PLAN_TARGET_AREA_UNITS = ['acre', 'hectare'] as const
export type JobPlanTargetAreaUnit = (typeof JOB_PLAN_TARGET_AREA_UNITS)[number]

/** Planned chemical usage for a job plan. */
export type JobPlanChemical = Instantiable & {
  planId: AssociationOne<JobPlan>
  chemicalId: AssociationOne<Chemical>
  amount: number
  unit: JobPlanChemicalUnit
  targetArea?: number
  targetAreaUnit?: JobPlanTargetAreaUnit
}

/** Junction mapping plans to assets. */
export type JobPlanAsset = {
  planId: AssociationJunction<JobPlan>
  assetId: AssociationJunction<Asset>
}

/** Execution record and immutable workflow manifest. */
export type JobWork = Instantiable & {
  jobId: AssociationOne<Job>
  startedById: AssociationOne<User>
  work: CompositionPositive<Id>
  startedAt: When
  completedAt?: When
}

/** Append-only execution event. */
export type JobWorkLogEntry = InstantiableOnly & {
  jobId: AssociationOne<Job>
  userId: AssociationOne<User>
  answer: CompositionOne<Answer>
}
