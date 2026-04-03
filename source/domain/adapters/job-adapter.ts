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
JobAdapter                Deserialize/Serialize Job.
JobAssessmentAdapter      Deserialize/Serialize JobAssessment.
JobWorkflowAdapter        Deserialize/Serialize JobWorkflow.
JobPlanAdapter            Deserialize/Serialize JobPlan.
JobPlanAssignmentAdapter  Deserialize/Serialize JobPlanAssignment.
JobPlanChemicalAdapter    Deserialize/Serialize JobPlanChemical.
JobPlanAssetAdapter       Deserialize/Serialize JobPlanAsset.
JobWorkAdapter            Deserialize/Serialize JobWork.
JobWorkLogEntryAdapter    Deserialize/Serialize JobWorkLogEntry.
*/

import { makeAdapter } from '@core/stdx'
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
import { AnswerAdapter, LocationAdapter, NoteAdapter } from '@domain/adapters/common-adapter.ts'

/** Deserialize/Serialize Job. */
export const JobAdapter = makeAdapter<Job>({
  id: ['id'],
  createdAt: ['created_at'],
  updatedAt: ['updated_at'],
  deletedAt: ['deleted_at'],
  customerId: ['customer_id'],
  status: ['status']
})

/** Deserialize/Serialize JobAssessment. */
export const JobAssessmentAdapter = makeAdapter<JobAssessment>({
  id: ['id'],
  createdAt: ['created_at'],
  updatedAt: ['updated_at'],
  deletedAt: ['deleted_at'],
  scheduledAt: ['scheduled_at'],
  startedAt: ['started_at'],
  completedAt: ['completed_at'],
  jobId: ['job_id'],
  assessorId: ['assessor_id'],
  locations: ['locations', LocationAdapter],
  risks: ['risks', NoteAdapter],
  notes: ['notes', NoteAdapter]
})

/** Deserialize/Serialize JobWorkflow. */
export const JobWorkflowAdapter = makeAdapter<JobWorkflow>({
  id: ['id'],
  createdAt: ['created_at'],
  updatedAt: ['updated_at'],
  deletedAt: ['deleted_at'],
  jobId: ['job_id'],
  basisWorkflowId: ['basis_workflow_id'],
  modifiedWorkflowId: ['modified_workflow_id']
})

/** Deserialize/Serialize JobPlan. */
export const JobPlanAdapter = makeAdapter<JobPlan>({
  id: ['id'],
  createdAt: ['created_at'],
  updatedAt: ['updated_at'],
  deletedAt: ['deleted_at'],
  jobId: ['job_id'],
  plannerId: ['planner_id'],
  notes: ['notes', NoteAdapter],
  scheduledStart: ['scheduled_start'],
  durationEstimate: ['duration_estimate']
})

/** Deserialize/Serialize JobPlanAssignment. */
export const JobPlanAssignmentAdapter = makeAdapter<JobPlanAssignment>({
  id: ['id'],
  createdAt: ['created_at'],
  updatedAt: ['updated_at'],
  deletedAt: ['deleted_at'],
  planId: ['plan_id'],
  crewMemberId: ['crew_member_id'],
  notes: ['notes', NoteAdapter],
  role: ['role']
})

/** Deserialize/Serialize JobPlanChemical. */
export const JobPlanChemicalAdapter = makeAdapter<JobPlanChemical>({
  id: ['id'],
  createdAt: ['created_at'],
  updatedAt: ['updated_at'],
  deletedAt: ['deleted_at'],
  planId: ['plan_id'],
  chemicalId: ['chemical_id'],
  amount: ['amount'],
  unit: ['unit'],
  targetArea: ['target_area'],
  targetAreaUnit: ['target_area_unit']
})

/** Deserialize/Serialize JobPlanAsset. */
export const JobPlanAssetAdapter = makeAdapter<JobPlanAsset>({
  planId: ['plan_id'],
  assetId: ['asset_id']
})

/** Deserialize/Serialize JobWork. */
export const JobWorkAdapter = makeAdapter<JobWork>({
  id: ['id'],
  createdAt: ['created_at'],
  updatedAt: ['updated_at'],
  deletedAt: ['deleted_at'],
  jobId: ['job_id'],
  startedById: ['started_by_id'],
  work: ['work'],
  startedAt: ['started_at'],
  completedAt: ['completed_at']
})

/** Deserialize/Serialize JobWorkLogEntry. */
export const JobWorkLogEntryAdapter = makeAdapter<JobWorkLogEntry>({
  id: ['id'],
  createdAt: ['created_at'],
  jobId: ['job_id'],
  userId: ['user_id'],
  answer: ['answer', AnswerAdapter]
})
