/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Job domain abstractions                                                     ║
║ Job lifecycle, planning, execution, and log-entry abstractions              ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines job lifecycle abstractions including planning and execution records.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
JOB_STATUSES                        Allowed job lifecycle states.
JobStatus                           Job lifecycle state union.
Job                                 Work agreement lifecycle anchor.
JobAssessment                       Pre-planning job assessment abstraction.
JobWorkflow                         Job workflow basis/modification abstraction.
JobPlan                             Job planning abstraction.
JobPlanAssignment                   Planned crew assignment abstraction.
JOB_PLAN_CHEMICAL_UNITS             Allowed chemical amount units.
JobPlanChemicalUnit                 Chemical amount unit union.
JOB_PLAN_TARGET_AREA_UNITS          Allowed target area units.
JobPlanTargetAreaUnit               Target area unit union.
JobPlanChemical                     Planned chemical usage abstraction.
JobPlanAsset                        Junction linking plans to assets.
JobWork                             Execution record and workflow manifest.
JobWorkLogEntry                     Append-only execution event log entry.
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

/** Job lifecycle state values. */
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

/** Pre-planning job assessment. */
export type JobAssessment = Instantiable & {
  jobId: AssociationOne<Job>
  assessorId: AssociationOne<User>
  scheduledAt: When
  startedAt?: When
  completedAt?: When
  locations: CompositionPositive<Location>
  risks: CompositionMany<Note>
  notes: CompositionMany<Note>
}

/** Workflows required of a job. */
export type JobWorkflow = Instantiable & {
  jobId: AssociationOne<Job>
  basisWorkflowId: AssociationOne<Workflow>
  modifiedWorkflowId?: AssociationOptional<Workflow>
}

/** Planning record for a job. */
export type JobPlan = Instantiable & {
  jobId: AssociationOne<Job>
  plannerId: AssociationOne<User>
  notes: CompositionMany<Note>
  scheduledStart: When
  durationEstimate: number
}

/** Planned user assignment for a job plan. */
export type JobPlanAssignment = Instantiable & {
  planId: AssociationOne<JobPlan>
  crewMemberId: AssociationOne<User>
  notes: CompositionMany<Note>
  role: UserRole
}

/** Allowed amount units for planned chemicals. */
export const JOB_PLAN_CHEMICAL_UNITS = ['gallon', 'liter', 'pound', 'kilogram'] as const
export type JobPlanChemicalUnit = (typeof JOB_PLAN_CHEMICAL_UNITS)[number]

/** Allowed target area units for planned chemicals. */
export const JOB_PLAN_TARGET_AREA_UNITS = ['acre', 'hectare'] as const
export type JobPlanTargetAreaUnit = (typeof JOB_PLAN_TARGET_AREA_UNITS)[number]

/** Planned chemical usage for a job plan. */
export type JobPlanChemical = Instantiable & {
  planId: AssociationOne<JobPlan>
  chemicalId: AssociationOne<Chemical>
  amount: number
  unit: JobPlanChemicalUnit
  targetArea?: number
  targetAreaUnit: JobPlanTargetAreaUnit
}

/** Junction linking job plans to required assets. */
export type JobPlanAsset = {
  planId: AssociationJunction<JobPlan>
  assetId: AssociationJunction<Asset>
}

/** Execution record with immutable workflow manifest. */
export type JobWork = Instantiable & {
  jobId: AssociationOne<Job>
  startedById: AssociationOne<User>
  work: CompositionPositive<Id>
  startedAt: When
  completedAt?: When
}

/** Append-only work execution event. */
export type JobWorkLogEntry = InstantiableOnly & {
  jobId: AssociationOne<Job>
  userId: AssociationOne<User>
  answer: CompositionOne<Answer>
}
