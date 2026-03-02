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

/** Job lifecycle state value. */
export type JobStatus = (typeof JOB_STATUSES)[number]

/** Work agreement lifecycle anchor. */
export type Job = Instantiable & {
  customerId: AssociationOne<Customer>
  status: JobStatus
}

/** Pre-planning assessment with one or more scoped locations. */
export type JobAssessment = Instantiable & {
  jobId: AssociationOne<Job>
  assessorId: AssociationOne<User>
  locations: CompositionPositive<Location>
  risks: CompositionMany<Note>
  notes: CompositionMany<Note>
}

/** Job-owned workflow selection referencing basis and optional modified workflow. */
export type JobWorkflow = Instantiable & {
  jobId: AssociationOne<Job>
  basisWorkflowId: AssociationOne<Workflow>
  modifiedWorkflowId?: AssociationOptional<Workflow>
}

/** Job-specific execution plan. */
export type JobPlan = Instantiable & {
  jobId: AssociationOne<Job>
  scheduledStart: When
  scheduledEnd?: When
  notes: CompositionMany<Note>
}

/** Assignment of a user to a plan role. */
export type JobPlanAssignment = Instantiable & {
  planId: AssociationOne<JobPlan>
  userId: AssociationOne<User>
  role: UserRole
  notes: CompositionMany<Note>
}

/** Planned chemical quantity unit set. */
export const PLANNED_CHEMICAL_UNITS = ['gallon', 'liter', 'pound', 'kilogram'] as const

/** Planned chemical quantity unit value. */
export type PlannedChemicalUnit = (typeof PLANNED_CHEMICAL_UNITS)[number]

/** Planned target-area unit set. */
export const TARGET_AREA_UNITS = ['acre', 'hectare'] as const

/** Planned target-area unit value. */
export type TargetAreaUnit = (typeof TARGET_AREA_UNITS)[number]

/** Planned chemical usage line item. */
export type JobPlanChemical = Instantiable & {
  planId: AssociationOne<JobPlan>
  chemicalId: AssociationOne<Chemical>
  amount: number
  unit: PlannedChemicalUnit
  targetArea?: number
  targetAreaUnit?: TargetAreaUnit
}

/** Junction linking plans to assets. */
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

/** Append-only execution event carrying one captured answer. */
export type JobWorkLogEntry = Pick<Instantiable, 'id' | 'createdAt'> & {
  jobId: AssociationOne<Job>
  userId: AssociationOne<User>
  answer: CompositionOne<Answer>
}
