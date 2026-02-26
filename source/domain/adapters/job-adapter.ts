/**
 * Job et al adapters to and from Dictionary representation.
 */

import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type {
  ChemicalUnit,
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
import {
  fromLocation,
  fromNote,
  toLocation,
  toNote
} from '@domain/adapters/common-adapter.ts'
import { fromAnswer, toAnswer } from '@domain/adapters/workflow-adapter.ts'

/** Create a Job from serialized dictionary format */
export const toJob = (dict: Dictionary): Job => {
  if (!dict.id) return notValid('Job dictionary missing required field: id')
  if (!dict.customer_id) {
    return notValid('Job dictionary missing required field: customer_id')
  }
  if (!dict.status) return notValid('Job dictionary missing required field: status')
  return {
    id: dict.id as string,
    customerId: dict.customer_id as string,
    status: dict.status as JobStatus,
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Serialize a Job to dictionary format */
export const fromJob = (job: Job): Dictionary => ({
  id: job.id,
  customer_id: job.customerId,
  status: job.status,
  created_at: job.createdAt,
  updated_at: job.updatedAt,
  deleted_at: job.deletedAt
})

/** Create a JobAssessment from serialized dictionary format */
export const toJobAssessment = (dict: Dictionary): JobAssessment => {
  if (!dict.id) return notValid('JobAssessment dictionary missing required field: id')
  if (!dict.job_id) {
    return notValid('JobAssessment dictionary missing required field: job_id')
  }
  if (!dict.assessor_id) {
    return notValid('JobAssessment dictionary missing required field: assessor_id')
  }
  return {
    id: dict.id as string,
    jobId: dict.job_id as string,
    assessorId: dict.assessor_id as string,
    locations: (dict.locations as Dictionary[]).map(toLocation),
    risks: (dict.risks as Dictionary[]).map(toNote),
    notes: (dict.notes as Dictionary[]).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Serialize a JobAssessment to dictionary format */
export const fromJobAssessment = (assessment: JobAssessment): Dictionary => ({
  id: assessment.id,
  job_id: assessment.jobId,
  assessor_id: assessment.assessorId,
  locations: assessment.locations.map(fromLocation),
  risks: assessment.risks.map(fromNote),
  notes: assessment.notes.map(fromNote),
  created_at: assessment.createdAt,
  updated_at: assessment.updatedAt,
  deleted_at: assessment.deletedAt
})

/** Create a JobWorkflow from serialized dictionary format */
export const toJobWorkflow = (dict: Dictionary): JobWorkflow => {
  if (!dict.id) return notValid('JobWorkflow dictionary missing required field: id')
  if (!dict.job_id) {
    return notValid('JobWorkflow dictionary missing required field: job_id')
  }
  if (!dict.basis_workflow_id) {
    return notValid('JobWorkflow dictionary missing required field: basis_workflow_id')
  }
  return {
    id: dict.id as string,
    jobId: dict.job_id as string,
    sequence: dict.sequence as number,
    basisWorkflowId: dict.basis_workflow_id as string,
    modifiedWorkflowId: dict.modified_workflow_id as string | undefined,
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Serialize a JobWorkflow to dictionary format */
export const fromJobWorkflow = (jobWorkflow: JobWorkflow): Dictionary => ({
  id: jobWorkflow.id,
  job_id: jobWorkflow.jobId,
  sequence: jobWorkflow.sequence,
  basis_workflow_id: jobWorkflow.basisWorkflowId,
  modified_workflow_id: jobWorkflow.modifiedWorkflowId,
  created_at: jobWorkflow.createdAt,
  updated_at: jobWorkflow.updatedAt,
  deleted_at: jobWorkflow.deletedAt
})

/** Create a JobPlan from serialized dictionary format */
export const toJobPlan = (dict: Dictionary): JobPlan => {
  if (!dict.id) return notValid('JobPlan dictionary missing required field: id')
  if (!dict.job_id) return notValid('JobPlan dictionary missing required field: job_id')
  if (!dict.scheduled_start) {
    return notValid('JobPlan dictionary missing required field: scheduled_start')
  }
  return {
    id: dict.id as string,
    jobId: dict.job_id as string,
    scheduledStart: dict.scheduled_start as When,
    scheduledEnd: dict.scheduled_end as When | undefined,
    notes: (dict.notes as Dictionary[]).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Serialize a JobPlan to dictionary format */
export const fromJobPlan = (plan: JobPlan): Dictionary => ({
  id: plan.id,
  job_id: plan.jobId,
  scheduled_start: plan.scheduledStart,
  scheduled_end: plan.scheduledEnd,
  notes: plan.notes.map(fromNote),
  created_at: plan.createdAt,
  updated_at: plan.updatedAt,
  deleted_at: plan.deletedAt
})

/** Create a JobPlanAssignment from serialized dictionary format */
export const toJobPlanAssignment = (dict: Dictionary): JobPlanAssignment => {
  if (!dict.id) return notValid('JobPlanAssignment dictionary missing required field: id')
  if (!dict.plan_id) {
    return notValid('JobPlanAssignment dictionary missing required field: plan_id')
  }
  if (!dict.user_id) {
    return notValid('JobPlanAssignment dictionary missing required field: user_id')
  }
  if (!dict.role) {
    return notValid('JobPlanAssignment dictionary missing required field: role')
  }
  return {
    id: dict.id as string,
    planId: dict.plan_id as string,
    userId: dict.user_id as string,
    role: dict.role as UserRole,
    notes: (dict.notes as Dictionary[]).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Serialize a JobPlanAssignment to dictionary format */
export const fromJobPlanAssignment = (assignment: JobPlanAssignment): Dictionary => ({
  id: assignment.id,
  plan_id: assignment.planId,
  user_id: assignment.userId,
  role: assignment.role,
  notes: assignment.notes.map(fromNote),
  created_at: assignment.createdAt,
  updated_at: assignment.updatedAt,
  deleted_at: assignment.deletedAt
})

/** Create a JobPlanChemical from serialized dictionary format */
export const toJobPlanChemical = (dict: Dictionary): JobPlanChemical => {
  if (!dict.id) return notValid('JobPlanChemical dictionary missing required field: id')
  if (!dict.plan_id) {
    return notValid('JobPlanChemical dictionary missing required field: plan_id')
  }
  if (!dict.chemical_id) {
    return notValid('JobPlanChemical dictionary missing required field: chemical_id')
  }
  return {
    id: dict.id as string,
    planId: dict.plan_id as string,
    chemicalId: dict.chemical_id as string,
    amount: dict.amount as number,
    unit: dict.unit as ChemicalUnit,
    targetArea: dict.target_area as number | undefined,
    targetAreaUnit: dict.target_area_unit as JobPlanChemical['targetAreaUnit'],
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Serialize a JobPlanChemical to dictionary format */
export const fromJobPlanChemical = (chemical: JobPlanChemical): Dictionary => ({
  id: chemical.id,
  plan_id: chemical.planId,
  chemical_id: chemical.chemicalId,
  amount: chemical.amount,
  unit: chemical.unit,
  target_area: chemical.targetArea,
  target_area_unit: chemical.targetAreaUnit,
  created_at: chemical.createdAt,
  updated_at: chemical.updatedAt,
  deleted_at: chemical.deletedAt
})

/** Create a JobPlanAsset from serialized dictionary format */
export const toJobPlanAsset = (dict: Dictionary): JobPlanAsset => ({
  planId: dict.plan_id as string,
  assetId: dict.asset_id as string
})

/** Serialize a JobPlanAsset to dictionary format */
export const fromJobPlanAsset = (junction: JobPlanAsset): Dictionary => ({
  plan_id: junction.planId,
  asset_id: junction.assetId
})

/** Create a JobWork from serialized dictionary format */
export const toJobWork = (dict: Dictionary): JobWork => {
  if (!dict.id) return notValid('JobWork dictionary missing required field: id')
  if (!dict.job_id) return notValid('JobWork dictionary missing required field: job_id')
  if (!dict.started_by_id) {
    return notValid('JobWork dictionary missing required field: started_by_id')
  }
  return {
    id: dict.id as string,
    jobId: dict.job_id as string,
    work: (dict.work as string[]).map(v => v),
    startedAt: dict.started_at as When,
    startedById: dict.started_by_id as string,
    completedAt: dict.completed_at as When | undefined,
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Serialize a JobWork to dictionary format */
export const fromJobWork = (work: JobWork): Dictionary => ({
  id: work.id,
  job_id: work.jobId,
  work: work.work.map(v => v),
  started_at: work.startedAt,
  started_by_id: work.startedById,
  completed_at: work.completedAt,
  created_at: work.createdAt,
  updated_at: work.updatedAt,
  deleted_at: work.deletedAt
})

/** Create a JobWorkLogEntry from serialized dictionary format */
export const toJobWorkLogEntry = (dict: Dictionary): JobWorkLogEntry => {
  if (!dict.id) return notValid('JobWorkLogEntry dictionary missing required field: id')
  if (!dict.job_id) {
    return notValid('JobWorkLogEntry dictionary missing required field: job_id')
  }
  if (!dict.user_id) {
    return notValid('JobWorkLogEntry dictionary missing required field: user_id')
  }
  return {
    id: dict.id as string,
    jobId: dict.job_id as string,
    userId: dict.user_id as string,
    answer: [toAnswer(dict.answer as Dictionary)],
    createdAt: dict.created_at as When
  }
}

/** Serialize a JobWorkLogEntry to dictionary format */
export const fromJobWorkLogEntry = (entry: JobWorkLogEntry): Dictionary => ({
  id: entry.id,
  job_id: entry.jobId,
  user_id: entry.userId,
  answer: fromAnswer(entry.answer[0]),
  created_at: entry.createdAt
})
