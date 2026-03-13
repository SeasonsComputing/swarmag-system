/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Job domain adapter                                                           ║
║ Serialization for job topic abstractions.                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Serializes between Dictionary and all job-related domain types: Job,
JobAssessment, JobWorkflow, JobPlan, JobPlanAssignment, JobPlanChemical,
JobPlanAsset, JobWork, and JobWorkLogEntry.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toJob                        Deserialize Job from a storage dictionary.
fromJob                      Serialize Job to a storage dictionary.
toJobAssessment              Deserialize JobAssessment from a storage dictionary.
fromJobAssessment            Serialize JobAssessment to a storage dictionary.
toJobWorkflow                Deserialize JobWorkflow from a storage dictionary.
fromJobWorkflow              Serialize JobWorkflow to a storage dictionary.
toJobPlan                    Deserialize JobPlan from a storage dictionary.
fromJobPlan                  Serialize JobPlan to a storage dictionary.
toJobPlanAssignment          Deserialize JobPlanAssignment from a storage dictionary.
fromJobPlanAssignment        Serialize JobPlanAssignment to a storage dictionary.
toJobPlanChemical            Deserialize JobPlanChemical from a storage dictionary.
fromJobPlanChemical          Serialize JobPlanChemical to a storage dictionary.
toJobPlanAsset               Deserialize JobPlanAsset junction from a storage dictionary.
fromJobPlanAsset             Serialize JobPlanAsset junction to a storage dictionary.
toJobWork                    Deserialize JobWork from a storage dictionary.
fromJobWork                  Serialize JobWork to a storage dictionary.
toJobWorkLogEntry            Deserialize JobWorkLogEntry from a storage dictionary.
fromJobWorkLogEntry          Serialize JobWorkLogEntry to a storage dictionary.
*/

import type {
  AssociationJunction,
  AssociationOne,
  AssociationOptional,
  CompositionMany,
  CompositionOne,
  CompositionPositive,
  Dictionary,
  Id,
  When
} from '@core/std'
import type { Asset } from '@domain/abstractions/asset.ts'
import type { Chemical } from '@domain/abstractions/chemical.ts'
import type { Answer, Location, Note } from '@domain/abstractions/common.ts'
import type { Customer } from '@domain/abstractions/customer.ts'
import type {
  AreaUnit,
  ChemicalAmountUnit,
  Job,
  JobAssessment,
  JobPlan,
  JobPlanAsset,
  JobPlanAssignment,
  JobPlanChemical,
  JobStatus,
  JobWork,
  JobWorkflow,
  JobWorkLogEntry
} from '@domain/abstractions/job.ts'
import type { UserRole } from '@domain/abstractions/user.ts'
import type { User } from '@domain/abstractions/user.ts'
import type { Workflow } from '@domain/abstractions/workflow.ts'
import {
  fromAnswer,
  fromLocation,
  fromNote,
  toAnswer,
  toLocation,
  toNote
} from '@domain/adapters/common-adapter.ts'

/** Deserialize Job from a storage dictionary. */
export const toJob = (dict: Dictionary): Job => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  customerId: dict.customer_id as AssociationOne<Customer>,
  status: dict.status as JobStatus
})

/** Serialize Job to a storage dictionary. */
export const fromJob = (job: Job): Dictionary => ({
  id: job.id,
  created_at: job.createdAt,
  updated_at: job.updatedAt,
  deleted_at: job.deletedAt,
  customer_id: job.customerId,
  status: job.status
})

/** Deserialize JobAssessment from a storage dictionary. */
export const toJobAssessment = (dict: Dictionary): JobAssessment => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  jobId: dict.job_id as AssociationOne<Job>,
  assessorId: dict.assessor_id as AssociationOne<User>,
  locations: (dict.locations as Dictionary[]).map(toLocation) as CompositionPositive<Location>,
  risks: (dict.risks as Dictionary[]).map(toNote) as CompositionMany<Note>,
  notes: (dict.notes as Dictionary[]).map(toNote) as CompositionMany<Note>
})

/** Serialize JobAssessment to a storage dictionary. */
export const fromJobAssessment = (assessment: JobAssessment): Dictionary => ({
  id: assessment.id,
  created_at: assessment.createdAt,
  updated_at: assessment.updatedAt,
  deleted_at: assessment.deletedAt,
  job_id: assessment.jobId,
  assessor_id: assessment.assessorId,
  locations: assessment.locations.map(fromLocation),
  risks: assessment.risks.map(fromNote),
  notes: assessment.notes.map(fromNote)
})

/** Deserialize JobWorkflow from a storage dictionary. */
export const toJobWorkflow = (dict: Dictionary): JobWorkflow => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  jobId: dict.job_id as AssociationOne<Job>,
  basisWorkflowId: dict.basis_workflow_id as AssociationOne<Workflow>,
  modifiedWorkflowId: dict.modified_workflow_id as AssociationOptional<Workflow>
})

/** Serialize JobWorkflow to a storage dictionary. */
export const fromJobWorkflow = (jobWorkflow: JobWorkflow): Dictionary => ({
  id: jobWorkflow.id,
  created_at: jobWorkflow.createdAt,
  updated_at: jobWorkflow.updatedAt,
  deleted_at: jobWorkflow.deletedAt,
  job_id: jobWorkflow.jobId,
  basis_workflow_id: jobWorkflow.basisWorkflowId,
  modified_workflow_id: jobWorkflow.modifiedWorkflowId
})

/** Deserialize JobPlan from a storage dictionary. */
export const toJobPlan = (dict: Dictionary): JobPlan => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  jobId: dict.job_id as AssociationOne<Job>,
  plannerId: dict.planner_id as AssociationOne<User>,
  notes: (dict.notes as Dictionary[]).map(toNote) as CompositionMany<Note>,
  scheduledStart: dict.scheduled_start as When,
  scheduledEnd: dict.scheduled_end as When | undefined
})

/** Serialize JobPlan to a storage dictionary. */
export const fromJobPlan = (plan: JobPlan): Dictionary => ({
  id: plan.id,
  created_at: plan.createdAt,
  updated_at: plan.updatedAt,
  deleted_at: plan.deletedAt,
  job_id: plan.jobId,
  planner_id: plan.plannerId,
  notes: plan.notes.map(fromNote),
  scheduled_start: plan.scheduledStart,
  scheduled_end: plan.scheduledEnd
})

/** Deserialize JobPlanAssignment from a storage dictionary. */
export const toJobPlanAssignment = (dict: Dictionary): JobPlanAssignment => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  planId: dict.plan_id as AssociationOne<JobPlan>,
  crewMemberId: dict.crew_member_id as AssociationOne<User>,
  notes: (dict.notes as Dictionary[]).map(toNote) as CompositionMany<Note>,
  role: dict.role as UserRole
})

/** Serialize JobPlanAssignment to a storage dictionary. */
export const fromJobPlanAssignment = (assignment: JobPlanAssignment): Dictionary => ({
  id: assignment.id,
  created_at: assignment.createdAt,
  updated_at: assignment.updatedAt,
  deleted_at: assignment.deletedAt,
  plan_id: assignment.planId,
  crew_member_id: assignment.crewMemberId,
  notes: assignment.notes.map(fromNote),
  role: assignment.role
})

/** Deserialize JobPlanChemical from a storage dictionary. */
export const toJobPlanChemical = (dict: Dictionary): JobPlanChemical => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  planId: dict.plan_id as AssociationOne<JobPlan>,
  chemicalId: dict.chemical_id as AssociationOne<Chemical>,
  amount: dict.amount as number,
  unit: dict.unit as ChemicalAmountUnit,
  targetArea: dict.target_area as number | undefined,
  targetAreaUnit: dict.target_area_unit as AreaUnit
})

/** Serialize JobPlanChemical to a storage dictionary. */
export const fromJobPlanChemical = (planChemical: JobPlanChemical): Dictionary => ({
  id: planChemical.id,
  created_at: planChemical.createdAt,
  updated_at: planChemical.updatedAt,
  deleted_at: planChemical.deletedAt,
  plan_id: planChemical.planId,
  chemical_id: planChemical.chemicalId,
  amount: planChemical.amount,
  unit: planChemical.unit,
  target_area: planChemical.targetArea,
  target_area_unit: planChemical.targetAreaUnit
})

/** Deserialize JobPlanAsset junction from a storage dictionary. */
export const toJobPlanAsset = (dict: Dictionary): JobPlanAsset => ({
  planId: dict.plan_id as AssociationJunction<JobPlan>,
  assetId: dict.asset_id as AssociationJunction<Asset>
})

/** Serialize JobPlanAsset junction to a storage dictionary. */
export const fromJobPlanAsset = (junction: JobPlanAsset): Dictionary => ({
  plan_id: junction.planId,
  asset_id: junction.assetId
})

/** Deserialize JobWork from a storage dictionary. */
export const toJobWork = (dict: Dictionary): JobWork => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  jobId: dict.job_id as AssociationOne<Job>,
  startedById: dict.started_by_id as AssociationOne<User>,
  work: dict.work as CompositionPositive<Id>,
  startedAt: dict.started_at as When,
  completedAt: dict.completed_at as When | undefined
})

/** Serialize JobWork to a storage dictionary. */
export const fromJobWork = (jobWork: JobWork): Dictionary => ({
  id: jobWork.id,
  created_at: jobWork.createdAt,
  updated_at: jobWork.updatedAt,
  deleted_at: jobWork.deletedAt,
  job_id: jobWork.jobId,
  started_by_id: jobWork.startedById,
  work: jobWork.work,
  started_at: jobWork.startedAt,
  completed_at: jobWork.completedAt
})

/** Deserialize JobWorkLogEntry from a storage dictionary. */
export const toJobWorkLogEntry = (dict: Dictionary): JobWorkLogEntry => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  jobId: dict.job_id as AssociationOne<Job>,
  userId: dict.user_id as AssociationOne<User>,
  answer: [toAnswer(dict.answer as Dictionary)] as CompositionOne<Answer>
})

/** Serialize JobWorkLogEntry to a storage dictionary. */
export const fromJobWorkLogEntry = (entry: JobWorkLogEntry): Dictionary => ({
  id: entry.id,
  created_at: entry.createdAt,
  job_id: entry.jobId,
  user_id: entry.userId,
  answer: fromAnswer(entry.answer[0]!)
})
