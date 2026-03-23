/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Job domain adapters                                                          ║
║ Dictionary serialization for job topic abstractions.                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Maps storage dictionaries to job abstractions and back.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toJob(dict)  Deserialize Job from dictionary.
fromJob(job)  Serialize Job to dictionary.
toJobAssessment(dict)  Deserialize JobAssessment from dictionary.
fromJobAssessment(assessment)  Serialize JobAssessment to dictionary.
toJobWorkflow(dict)  Deserialize JobWorkflow from dictionary.
fromJobWorkflow(record)  Serialize JobWorkflow to dictionary.
toJobPlan(dict)  Deserialize JobPlan from dictionary.
fromJobPlan(plan)  Serialize JobPlan to dictionary.
toJobPlanAssignment(dict)  Deserialize JobPlanAssignment from dictionary.
fromJobPlanAssignment(assignment)  Serialize JobPlanAssignment to dictionary.
toJobPlanChemical(dict)  Deserialize JobPlanChemical from dictionary.
fromJobPlanChemical(chemical)  Serialize JobPlanChemical to dictionary.
toJobPlanAsset(dict)  Deserialize JobPlanAsset from dictionary.
fromJobPlanAsset(record)  Serialize JobPlanAsset to dictionary.
toJobWork(dict)  Deserialize JobWork from dictionary.
fromJobWork(work)  Serialize JobWork to dictionary.
toJobWorkLogEntry(dict)  Deserialize JobWorkLogEntry from dictionary.
fromJobWorkLogEntry(entry)  Serialize JobWorkLogEntry to dictionary.
*/

import type { Dictionary } from '@core/std'
import type {
  Job,
  JobAssessment,
  JobPlan,
  JobPlanAsset,
  JobPlanAssignment,
  JobPlanChemical,
  JobWork,
  JobWorkflow,
  JobWorkLogEntry
} from '@domain/abstractions/job.ts'
import {
  fromAnswer,
  fromLocation,
  fromNote,
  toAnswer,
  toLocation,
  toNote
} from '@domain/adapters/common-adapter.ts'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

export const toJob = (dict: Dictionary): Job => ({
  id: dict.id as string,
  createdAt: dict.created_at as string,
  updatedAt: dict.updated_at as string,
  deletedAt: dict.deleted_at as string | undefined,
  customerId: dict.customer_id as string,
  status: dict.status as Job['status']
})

export const fromJob = (job: Job): Dictionary => ({
  id: job.id,
  created_at: job.createdAt,
  updated_at: job.updatedAt,
  deleted_at: job.deletedAt,
  customer_id: job.customerId,
  status: job.status
})

export const toJobAssessment = (dict: Dictionary): JobAssessment => ({
  id: dict.id as string,
  createdAt: dict.created_at as string,
  updatedAt: dict.updated_at as string,
  deletedAt: dict.deleted_at as string | undefined,
  scheduledAt: dict.scheduled_at as string,
  startedAt: dict.started_at as string | undefined,
  completedAt: dict.completed_at as string | undefined,
  jobId: dict.job_id as string,
  assessorId: dict.assessor_id as string,
  locations: (dict.locations as Dictionary[] | undefined ?? []).map(toLocation),
  risks: (dict.risks as Dictionary[] | undefined ?? []).map(toNote),
  notes: (dict.notes as Dictionary[] | undefined ?? []).map(toNote)
})

export const fromJobAssessment = (assessment: JobAssessment): Dictionary => ({
  id: assessment.id,
  created_at: assessment.createdAt,
  updated_at: assessment.updatedAt,
  deleted_at: assessment.deletedAt,
  scheduled_at: assessment.scheduledAt,
  started_at: assessment.startedAt,
  completed_at: assessment.completedAt,
  job_id: assessment.jobId,
  assessor_id: assessment.assessorId,
  locations: assessment.locations.map(fromLocation),
  risks: assessment.risks.map(fromNote),
  notes: assessment.notes.map(fromNote)
})

export const toJobWorkflow = (dict: Dictionary): JobWorkflow => ({
  id: dict.id as string,
  createdAt: dict.created_at as string,
  updatedAt: dict.updated_at as string,
  deletedAt: dict.deleted_at as string | undefined,
  jobId: dict.job_id as string,
  basisWorkflowId: dict.basis_workflow_id as string,
  modifiedWorkflowId: dict.modified_workflow_id as string | undefined
})

export const fromJobWorkflow = (record: JobWorkflow): Dictionary => ({
  id: record.id,
  created_at: record.createdAt,
  updated_at: record.updatedAt,
  deleted_at: record.deletedAt,
  job_id: record.jobId,
  basis_workflow_id: record.basisWorkflowId,
  modified_workflow_id: record.modifiedWorkflowId
})

export const toJobPlan = (dict: Dictionary): JobPlan => ({
  id: dict.id as string,
  createdAt: dict.created_at as string,
  updatedAt: dict.updated_at as string,
  deletedAt: dict.deleted_at as string | undefined,
  jobId: dict.job_id as string,
  plannerId: dict.planner_id as string,
  notes: (dict.notes as Dictionary[] | undefined ?? []).map(toNote),
  scheduledStart: dict.scheduled_start as string,
  durationEstimate: dict.duration_estimate as number
})

export const fromJobPlan = (plan: JobPlan): Dictionary => ({
  id: plan.id,
  created_at: plan.createdAt,
  updated_at: plan.updatedAt,
  deleted_at: plan.deletedAt,
  job_id: plan.jobId,
  planner_id: plan.plannerId,
  notes: plan.notes.map(fromNote),
  scheduled_start: plan.scheduledStart,
  duration_estimate: plan.durationEstimate
})

export const toJobPlanAssignment = (dict: Dictionary): JobPlanAssignment => ({
  id: dict.id as string,
  createdAt: dict.created_at as string,
  updatedAt: dict.updated_at as string,
  deletedAt: dict.deleted_at as string | undefined,
  planId: dict.plan_id as string,
  crewMemberId: dict.crew_member_id as string,
  notes: (dict.notes as Dictionary[] | undefined ?? []).map(toNote),
  role: dict.role as JobPlanAssignment['role']
})

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

export const toJobPlanChemical = (dict: Dictionary): JobPlanChemical => ({
  id: dict.id as string,
  createdAt: dict.created_at as string,
  updatedAt: dict.updated_at as string,
  deletedAt: dict.deleted_at as string | undefined,
  planId: dict.plan_id as string,
  chemicalId: dict.chemical_id as string,
  amount: dict.amount as number,
  unit: dict.unit as JobPlanChemical['unit'],
  targetArea: dict.target_area as number | undefined,
  targetAreaUnit: dict.target_area_unit as JobPlanChemical['targetAreaUnit']
})

export const fromJobPlanChemical = (chemical: JobPlanChemical): Dictionary => ({
  id: chemical.id,
  created_at: chemical.createdAt,
  updated_at: chemical.updatedAt,
  deleted_at: chemical.deletedAt,
  plan_id: chemical.planId,
  chemical_id: chemical.chemicalId,
  amount: chemical.amount,
  unit: chemical.unit,
  target_area: chemical.targetArea,
  target_area_unit: chemical.targetAreaUnit
})

export const toJobPlanAsset = (dict: Dictionary): JobPlanAsset => ({
  planId: dict.plan_id as string,
  assetId: dict.asset_id as string
})

export const fromJobPlanAsset = (record: JobPlanAsset): Dictionary => ({
  plan_id: record.planId,
  asset_id: record.assetId
})

export const toJobWork = (dict: Dictionary): JobWork => ({
  id: dict.id as string,
  createdAt: dict.created_at as string,
  updatedAt: dict.updated_at as string,
  deletedAt: dict.deleted_at as string | undefined,
  jobId: dict.job_id as string,
  startedById: dict.started_by_id as string,
  work: (dict.work as string[] | undefined) ?? [],
  startedAt: dict.started_at as string,
  completedAt: dict.completed_at as string | undefined
})

export const fromJobWork = (work: JobWork): Dictionary => ({
  id: work.id,
  created_at: work.createdAt,
  updated_at: work.updatedAt,
  deleted_at: work.deletedAt,
  job_id: work.jobId,
  started_by_id: work.startedById,
  work: work.work,
  started_at: work.startedAt,
  completed_at: work.completedAt
})

export const toJobWorkLogEntry = (dict: Dictionary): JobWorkLogEntry => ({
  id: dict.id as string,
  createdAt: dict.created_at as string,
  jobId: dict.job_id as string,
  userId: dict.user_id as string,
  answer: [toAnswer(dict.answer as Dictionary)]
})

export const fromJobWorkLogEntry = (entry: JobWorkLogEntry): Dictionary => ({
  id: entry.id,
  created_at: entry.createdAt,
  job_id: entry.jobId,
  user_id: entry.userId,
  answer: fromAnswer(entry.answer[0] as never)
})
