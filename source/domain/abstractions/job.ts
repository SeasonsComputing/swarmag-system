/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Job domain abstractions                                                      ║
║ Work agreement life-cycle, assessment, planning, and execution types.        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines the Job aggregate and all related abstractions: JobAssessment,
JobWorkflow, JobPlan, JobPlanAssignment, JobPlanChemical, JobPlanAsset,
JobWork, and JobWorkLogEntry.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
JOB_STATUSES           Canonical job life-cycle state values.
JobStatus              Job status union type.
Job                    Work agreement life-cycle anchor.
JobAssessment          Pre-planning job assessment; requires one or more locations.
JobWorkflow            Workflows required of a job; basis may be customized.
JobPlan                Planning for a job based on an assessment.
JobPlanAssignment      Planned user assignment required for a job.
JobPlanChemical        Planned chemical usage required for a job.
CHEMICAL_AMOUNT_UNITS  Canonical chemical amount unit values.
ChemicalAmountUnit     Chemical amount unit type.
AREA_UNITS             Canonical target area unit values.
AreaUnit               Target area unit type.
JobPlanAsset           Junction — planned assets required for a job.
JobWork                Execution record; creation transitions job to executing.
JobWorkLogEntry        Work execution event; append-only log.
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

// ────────────────────────────────────────────────────────────────────────────
// JOB
// ────────────────────────────────────────────────────────────────────────────

/** Canonical job life-cycle state values. */
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

// ────────────────────────────────────────────────────────────────────────────
// JOB ASSESSMENT
// ────────────────────────────────────────────────────────────────────────────

/** Pre-planning job assessment; requires one or more locations. */
export type JobAssessment = Instantiable & {
  jobId: AssociationOne<Job>
  assessorId: AssociationOne<User>
  locations: CompositionPositive<Location>
  risks: CompositionMany<Note>
  notes: CompositionMany<Note>
}

// ────────────────────────────────────────────────────────────────────────────
// JOB WORKFLOW
// ────────────────────────────────────────────────────────────────────────────

/** Workflows required of a job; basis workflow may be customized for a job. */
export type JobWorkflow = Instantiable & {
  jobId: AssociationOne<Job>
  basisWorkflowId: AssociationOne<Workflow>
  modifiedWorkflowId: AssociationOptional<Workflow>
}

// ────────────────────────────────────────────────────────────────────────────
// JOB PLAN
// ────────────────────────────────────────────────────────────────────────────

/** Planning for a job based on an assessment. */
export type JobPlan = Instantiable & {
  jobId: AssociationOne<Job>
  plannerId: AssociationOne<User>
  notes: CompositionMany<Note>
  scheduledStart: When
  scheduledEnd?: When
}

/** Planned user assignment required for a job. */
export type JobPlanAssignment = Instantiable & {
  planId: AssociationOne<JobPlan>
  crewMemberId: AssociationOne<User>
  notes: CompositionMany<Note>
  role: UserRole
}

/** Canonical chemical amount unit values. */
export const CHEMICAL_AMOUNT_UNITS = ['gallon', 'liter', 'pound', 'kilogram'] as const
export type ChemicalAmountUnit = (typeof CHEMICAL_AMOUNT_UNITS)[number]

/** Canonical target area unit values. */
export const AREA_UNITS = ['acre', 'hectare'] as const
export type AreaUnit = (typeof AREA_UNITS)[number]

/** Planned chemical usage required for a job. */
export type JobPlanChemical = Instantiable & {
  planId: AssociationOne<JobPlan>
  chemicalId: AssociationOne<Chemical>
  amount: number
  unit: ChemicalAmountUnit
  targetArea?: number
  targetAreaUnit: AreaUnit
}

/** Junction — planned assets required for a job; hard delete only. */
export type JobPlanAsset = {
  planId: AssociationJunction<JobPlan>
  assetId: AssociationJunction<Asset>
}

// ────────────────────────────────────────────────────────────────────────────
// JOB WORK
// ────────────────────────────────────────────────────────────────────────────

/** Execution record; creation transitions job to executing; work is the immutable manifest. */
export type JobWork = Instantiable & {
  jobId: AssociationOne<Job>
  startedById: AssociationOne<User>
  work: CompositionPositive<Id>
  startedAt: When
  completedAt?: When
}

/** Work execution event; append-only log; event details as Answer to Question. */
export type JobWorkLogEntry = InstantiableOnly & {
  jobId: AssociationOne<Job>
  userId: AssociationOne<User>
  answer: CompositionOne<Answer>
}
