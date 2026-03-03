/**
 * Domain models for jobs and execution lifecycle in the swarmAg system.
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
import type { Answer, Location, Note } from '@domain/abstractions/common.ts'
import type { Customer } from '@domain/abstractions/customer.ts'
import type { User, UserRole } from '@domain/abstractions/user.ts'
import type { Workflow } from '@domain/abstractions/workflow.ts'

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

/** Work agreement lifecycle anchor. */
export type Job = Instantiable & {
  customerId: AssociationOne<Customer>
  status: JobStatus
}

/** Pre-planning assessment. */
export type JobAssessment = Instantiable & {
  jobId: AssociationOne<Job>
  assessorId: AssociationOne<User>
  locations: CompositionPositive<Location>
  risks: CompositionMany<Note>
  notes: CompositionMany<Note>
}

/** Job-specific workflow assignment and specialization state. */
export type JobWorkflow = Instantiable & {
  jobId: AssociationOne<Job>
  basisWorkflowId: AssociationOne<Workflow>
  modifiedWorkflowId?: AssociationOptional<Workflow>
}

/** Job-specific execution plan. */
export type JobPlan = Instantiable & {
  jobId: AssociationOne<Job>
  notes: CompositionMany<Note>
  scheduledStart: When
  scheduledEnd?: When
}

/** Assignment of user to plan role. */
export type JobPlanAssignment = Instantiable & {
  planId: AssociationOne<JobPlan>
  userId: AssociationOne<User>
  notes: CompositionMany<Note>
  role: UserRole
}

/** Chemical amount units for plan usage. */
export const CHEMICAL_AMOUNT_UNITS = ['gallon', 'liter', 'pound', 'kilogram'] as const
export type ChemicalAmountUnit = (typeof CHEMICAL_AMOUNT_UNITS)[number]

/** Target area units for planned application. */
export const TARGET_AREA_UNITS = ['acre', 'hectare'] as const
export type TargetAreaUnit = (typeof TARGET_AREA_UNITS)[number]

/** Planned chemical usage. */
export type JobPlanChemical = Instantiable & {
  planId: AssociationOne<JobPlan>
  chemicalId: AssociationOne<Chemical>
  amount: number
  unit: ChemicalAmountUnit
  targetArea?: number
  targetAreaUnit?: TargetAreaUnit
}

/** m:m junction between plans and assets. */
export type JobPlanAsset = {
  planId: AssociationJunction<JobPlan>
  assetId: AssociationJunction<Asset>
}

/** Execution record and finalized workflow manifest. */
export type JobWork = Instantiable & {
  jobId: AssociationOne<Job>
  startedById: AssociationOne<User>
  work: CompositionPositive<Id>
  startedAt: When
  completedAt?: When
}

/** Append-only execution event. */
export type JobWorkLogEntry = Pick<Instantiable, 'id' | 'createdAt'> & {
  jobId: AssociationOne<Job>
  userId: AssociationOne<User>
  answer: CompositionOne<Answer>
}
