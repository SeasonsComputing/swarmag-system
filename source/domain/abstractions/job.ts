/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Job domain abstractions                                                      ║
║ Canonical types for job life-cycle planning and execution.                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines job abstractions spanning assessment, planning, and execution records.
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
} from '@core/std'
import type { Asset } from '@domain/abstractions/asset.ts'
import type { Chemical } from '@domain/abstractions/chemical.ts'
import type { Answer, Location, Note } from '@domain/abstractions/common.ts'
import type { Customer } from '@domain/abstractions/customer.ts'
import type { User, UserRole } from '@domain/abstractions/user.ts'
import type { Workflow } from '@domain/abstractions/workflow.ts'

/** Allowed job status values. */
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

/** Work agreement life-cycle anchor. */
export type Job = Instantiable & {
  customerId: AssociationOne<Customer>
  status: JobStatus
}

/** Pre-planning job assessment abstraction. */
export type JobAssessment = Instantiable & {
  scheduledAt: When
  startedAt?: When
  completedAt?: When
  jobId: AssociationOne<Job>
  assessorId: AssociationOne<User>
  locations: CompositionPositive<Location>
  risks: CompositionMany<Note>
  notes: CompositionMany<Note>
}

/** Workflows required of a job. */
export type JobWorkflow = Instantiable & {
  jobId: AssociationOne<Job>
  basisWorkflowId: AssociationOne<Workflow>
  modifiedWorkflowId: AssociationOptional<Workflow>
}

/** Planning record for a job. */
export type JobPlan = Instantiable & {
  jobId: AssociationOne<Job>
  plannerId: AssociationOne<User>
  notes: CompositionMany<Note>
  scheduledStart: When
  durationEstimate: number
}

/** Planned user assignment for a job. */
export type JobPlanAssignment = Instantiable & {
  planId: AssociationOne<JobPlan>
  crewMemberId: AssociationOne<User>
  notes: CompositionMany<Note>
  role: UserRole
}

/** Allowed units for planned chemical amount. */
export const JOB_PLAN_CHEMICAL_UNITS = ['gallon', 'liter', 'pound', 'kilogram'] as const
export type JobPlanChemicalUnit = (typeof JOB_PLAN_CHEMICAL_UNITS)[number]

/** Allowed units for planned target area. */
export const JOB_PLAN_TARGET_AREA_UNITS = ['acre', 'hectare'] as const
export type JobPlanTargetAreaUnit = (typeof JOB_PLAN_TARGET_AREA_UNITS)[number]

/** Planned chemical usage record. */
export type JobPlanChemical = Instantiable & {
  planId: AssociationOne<JobPlan>
  chemicalId: AssociationOne<Chemical>
  amount: number
  unit: JobPlanChemicalUnit
  targetArea?: number
  targetAreaUnit: JobPlanTargetAreaUnit
}

/** Junction for planned assets on a job plan. */
export type JobPlanAsset = {
  planId: AssociationJunction<JobPlan>
  assetId: AssociationJunction<Asset>
}

/** Execution record for a job. */
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
