/**
 * Adapters for converting between Dictionary and Job domain abstractions.
 */

import type { Dictionary } from '@core-std'
import { notValid } from '@core-std'
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

/** Convert a Dictionary to a Job domain object. */
export const toJob = (dict: Dictionary): Job => {
  if (!dict['id']) notValid('Job dictionary missing required field: id')
  if (!dict['customer_id']) notValid('Job dictionary missing required field: customer_id')
  if (!dict['status']) notValid('Job dictionary missing required field: status')
  if (!dict['created_at']) notValid('Job dictionary missing required field: created_at')
  if (!dict['updated_at']) notValid('Job dictionary missing required field: updated_at')

  return {
    id: dict['id'] as string,
    customerId: dict['customer_id'] as string,
    status: dict['status'] as Job['status'],
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined
  }
}

/** Convert a Job domain object to a Dictionary. */
export const fromJob = (job: Job): Dictionary => ({
  id: job.id,
  customer_id: job.customerId,
  status: job.status,
  created_at: job.createdAt,
  updated_at: job.updatedAt,
  deleted_at: job.deletedAt
})

/** Convert a Dictionary to a JobAssessment domain object. */
export const toJobAssessment = (dict: Dictionary): JobAssessment => {
  if (!dict['id']) notValid('JobAssessment dictionary missing required field: id')
  if (!dict['job_id']) notValid('JobAssessment dictionary missing required field: job_id')
  if (!dict['assessor_id']) {
    notValid('JobAssessment dictionary missing required field: assessor_id')
  }
  if (!dict['created_at']) {
    notValid('JobAssessment dictionary missing required field: created_at')
  }
  if (!dict['updated_at']) {
    notValid('JobAssessment dictionary missing required field: updated_at')
  }

  return {
    id: dict['id'] as string,
    jobId: dict['job_id'] as string,
    assessorId: dict['assessor_id'] as string,
    locations: (dict['locations'] ?? []) as JobAssessment['locations'],
    risks: (dict['risks'] ?? []) as JobAssessment['risks'],
    notes: (dict['notes'] ?? []) as JobAssessment['notes'],
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined
  }
}

/** Convert a JobAssessment domain object to a Dictionary. */
export const fromJobAssessment = (assessment: JobAssessment): Dictionary => ({
  id: assessment.id,
  job_id: assessment.jobId,
  assessor_id: assessment.assessorId,
  locations: assessment.locations,
  risks: assessment.risks,
  notes: assessment.notes,
  created_at: assessment.createdAt,
  updated_at: assessment.updatedAt,
  deleted_at: assessment.deletedAt
})

/** Convert a Dictionary to a JobWorkflow domain object. */
export const toJobWorkflow = (dict: Dictionary): JobWorkflow => {
  if (!dict['id']) notValid('JobWorkflow dictionary missing required field: id')
  if (!dict['job_id']) notValid('JobWorkflow dictionary missing required field: job_id')
  if (dict['sequence'] === undefined || dict['sequence'] === null) {
    notValid('JobWorkflow dictionary missing required field: sequence')
  }
  if (!dict['basis_workflow_id']) {
    notValid('JobWorkflow dictionary missing required field: basis_workflow_id')
  }
  if (!dict['created_at']) {
    notValid('JobWorkflow dictionary missing required field: created_at')
  }
  if (!dict['updated_at']) {
    notValid('JobWorkflow dictionary missing required field: updated_at')
  }

  return {
    id: dict['id'] as string,
    jobId: dict['job_id'] as string,
    sequence: dict['sequence'] as number,
    basisWorkflowId: dict['basis_workflow_id'] as string,
    modifiedWorkflowId: dict['modified_workflow_id'] as string | undefined,
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined
  }
}

/** Convert a JobWorkflow domain object to a Dictionary. */
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

/** Convert a Dictionary to a JobPlanAssignment domain object. */
export const toJobPlanAssignment = (dict: Dictionary): JobPlanAssignment => {
  if (!dict['plan_id']) {
    notValid('JobPlanAssignment dictionary missing required field: plan_id')
  }
  if (!dict['user_id']) {
    notValid('JobPlanAssignment dictionary missing required field: user_id')
  }
  if (!dict['role']) notValid('JobPlanAssignment dictionary missing required field: role')

  return {
    planId: dict['plan_id'] as string,
    userId: dict['user_id'] as string,
    role: dict['role'] as string,
    notes: (dict['notes'] ?? []) as JobPlanAssignment['notes'],
    deletedAt: dict['deleted_at'] as string | undefined
  }
}

/** Convert a JobPlanAssignment domain object to a Dictionary. */
export const fromJobPlanAssignment = (assignment: JobPlanAssignment): Dictionary => ({
  plan_id: assignment.planId,
  user_id: assignment.userId,
  role: assignment.role,
  notes: assignment.notes,
  deleted_at: assignment.deletedAt
})

/** Convert a Dictionary to a JobPlanChemical domain object. */
export const toJobPlanChemical = (dict: Dictionary): JobPlanChemical => {
  if (!dict['plan_id']) notValid('JobPlanChemical dictionary missing required field: plan_id')
  if (!dict['chemical_id']) {
    notValid('JobPlanChemical dictionary missing required field: chemical_id')
  }
  if (dict['amount'] === undefined || dict['amount'] === null) {
    notValid('JobPlanChemical dictionary missing required field: amount')
  }
  if (!dict['unit']) notValid('JobPlanChemical dictionary missing required field: unit')

  return {
    planId: dict['plan_id'] as string,
    chemicalId: dict['chemical_id'] as string,
    amount: dict['amount'] as number,
    unit: dict['unit'] as JobPlanChemical['unit'],
    targetArea: dict['target_area'] as number | undefined,
    targetAreaUnit: dict['target_area_unit'] as JobPlanChemical['targetAreaUnit'],
    deletedAt: dict['deleted_at'] as string | undefined
  }
}

/** Convert a JobPlanChemical domain object to a Dictionary. */
export const fromJobPlanChemical = (planChemical: JobPlanChemical): Dictionary => ({
  plan_id: planChemical.planId,
  chemical_id: planChemical.chemicalId,
  amount: planChemical.amount,
  unit: planChemical.unit,
  target_area: planChemical.targetArea,
  target_area_unit: planChemical.targetAreaUnit,
  deleted_at: planChemical.deletedAt
})

/** Convert a Dictionary to a JobPlanAsset domain object. */
export const toJobPlanAsset = (dict: Dictionary): JobPlanAsset => {
  if (!dict['plan_id']) notValid('JobPlanAsset dictionary missing required field: plan_id')
  if (!dict['asset_id']) notValid('JobPlanAsset dictionary missing required field: asset_id')

  return {
    planId: dict['plan_id'] as string,
    assetId: dict['asset_id'] as string,
    deletedAt: dict['deleted_at'] as string | undefined
  }
}

/** Convert a JobPlanAsset domain object to a Dictionary. */
export const fromJobPlanAsset = (planAsset: JobPlanAsset): Dictionary => ({
  plan_id: planAsset.planId,
  asset_id: planAsset.assetId,
  deleted_at: planAsset.deletedAt
})

/** Convert a Dictionary to a JobPlan domain object. */
export const toJobPlan = (dict: Dictionary): JobPlan => {
  if (!dict['id']) notValid('JobPlan dictionary missing required field: id')
  if (!dict['job_id']) notValid('JobPlan dictionary missing required field: job_id')
  if (!dict['scheduled_start']) {
    notValid('JobPlan dictionary missing required field: scheduled_start')
  }
  if (!dict['created_at']) notValid('JobPlan dictionary missing required field: created_at')
  if (!dict['updated_at']) notValid('JobPlan dictionary missing required field: updated_at')

  return {
    id: dict['id'] as string,
    jobId: dict['job_id'] as string,
    scheduledStart: dict['scheduled_start'] as string,
    scheduledEnd: dict['scheduled_end'] as string | undefined,
    notes: (dict['notes'] ?? []) as JobPlan['notes'],
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined
  }
}

/** Convert a JobPlan domain object to a Dictionary. */
export const fromJobPlan = (plan: JobPlan): Dictionary => ({
  id: plan.id,
  job_id: plan.jobId,
  scheduled_start: plan.scheduledStart,
  scheduled_end: plan.scheduledEnd,
  notes: plan.notes,
  created_at: plan.createdAt,
  updated_at: plan.updatedAt,
  deleted_at: plan.deletedAt
})

/** Convert a Dictionary to a JobWork domain object. */
export const toJobWork = (dict: Dictionary): JobWork => {
  if (!dict['id']) notValid('JobWork dictionary missing required field: id')
  if (!dict['job_id']) notValid('JobWork dictionary missing required field: job_id')
  if (!dict['started_at']) notValid('JobWork dictionary missing required field: started_at')
  if (!dict['started_by_id']) {
    notValid('JobWork dictionary missing required field: started_by_id')
  }
  if (!dict['created_at']) notValid('JobWork dictionary missing required field: created_at')
  if (!dict['updated_at']) notValid('JobWork dictionary missing required field: updated_at')

  return {
    id: dict['id'] as string,
    jobId: dict['job_id'] as string,
    work: (dict['work'] ?? []) as JobWork['work'],
    startedAt: dict['started_at'] as string,
    startedById: dict['started_by_id'] as string,
    completedAt: dict['completed_at'] as string | undefined,
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined
  }
}

/** Convert a JobWork domain object to a Dictionary. */
export const fromJobWork = (jobWork: JobWork): Dictionary => ({
  id: jobWork.id,
  job_id: jobWork.jobId,
  work: jobWork.work,
  started_at: jobWork.startedAt,
  started_by_id: jobWork.startedById,
  completed_at: jobWork.completedAt,
  created_at: jobWork.createdAt,
  updated_at: jobWork.updatedAt,
  deleted_at: jobWork.deletedAt
})

/** Convert a Dictionary to a JobWorkLogEntry domain object. */
export const toJobWorkLogEntry = (dict: Dictionary): JobWorkLogEntry => {
  if (!dict['id']) notValid('JobWorkLogEntry dictionary missing required field: id')
  if (!dict['job_id']) notValid('JobWorkLogEntry dictionary missing required field: job_id')
  if (!dict['user_id']) notValid('JobWorkLogEntry dictionary missing required field: user_id')
  if (!dict['created_at']) {
    notValid('JobWorkLogEntry dictionary missing required field: created_at')
  }

  const base = {
    id: dict['id'] as string,
    jobId: dict['job_id'] as string,
    userId: dict['user_id'] as string,
    createdAt: dict['created_at'] as string
  }

  const answer = dict['answer'] as JobWorkLogEntry['answer']
  const metadata = dict['metadata'] as JobWorkLogEntry['metadata']

  if (answer !== undefined && metadata !== undefined) {
    return { ...base, answer, metadata }
  }
  if (answer !== undefined) {
    return { ...base, answer }
  }
  if (metadata !== undefined) {
    return { ...base, metadata }
  }

  notValid('JobWorkLogEntry dictionary must contain at least one of: answer, metadata')
}

/** Convert a JobWorkLogEntry domain object to a Dictionary. */
export const fromJobWorkLogEntry = (entry: JobWorkLogEntry): Dictionary => ({
  id: entry.id,
  job_id: entry.jobId,
  user_id: entry.userId,
  created_at: entry.createdAt,
  answer: 'answer' in entry ? entry.answer : undefined,
  metadata: 'metadata' in entry ? entry.metadata : undefined
})
