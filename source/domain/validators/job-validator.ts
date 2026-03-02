/**
 * Validators for the job domain area: all job type create and update shapes.
 * No JobWorkUpdate — execution manifest is immutable.
 * No JobWorkLogEntryUpdate — append-only.
 */

import type { Dictionary } from '@core-std'
import {
  isCompositionMany,
  isCompositionOne,
  isCompositionPositive,
  isId,
  isNonEmptyString,
  isWhen
} from '@core-std'
import type {
  JobStatus,
  PlannedChemicalUnit,
  TargetAreaUnit
} from '@domain/abstractions/job.ts'
import {
  JOB_STATUSES,
  PLANNED_CHEMICAL_UNITS,
  TARGET_AREA_UNITS
} from '@domain/abstractions/job.ts'
import type { UserRole } from '@domain/abstractions/user.ts'
import { USER_ROLES } from '@domain/abstractions/user.ts'
import type {
  JobAssessmentCreate,
  JobAssessmentUpdate,
  JobCreate,
  JobPlanAssignmentCreate,
  JobPlanAssignmentUpdate,
  JobPlanChemicalCreate,
  JobPlanChemicalUpdate,
  JobPlanCreate,
  JobPlanUpdate,
  JobUpdate,
  JobWorkCreate,
  JobWorkflowCreate,
  JobWorkflowUpdate,
  JobWorkLogEntryCreate
} from '@domain/protocols/job-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates JobCreate; returns error message or null. */
export const validateJobCreate = (input: JobCreate): string | null => {
  if (!isId(input.customerId)) return 'customerId must be a valid UUID'
  if (!isJobStatus(input.status)) return 'status must be a valid JobStatus'
  return null
}

/** Validates JobUpdate; returns error message or null. */
export const validateJobUpdate = (input: JobUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid UUID'
  if (input.customerId !== undefined && !isId(input.customerId)) {
    return 'customerId must be a valid UUID'
  }
  if (input.status !== undefined && !isJobStatus(input.status)) {
    return 'status must be a valid JobStatus'
  }
  return null
}

/** Validates JobAssessmentCreate; returns error message or null. */
export const validateJobAssessmentCreate = (
  input: JobAssessmentCreate
): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid UUID'
  if (!isId(input.assessorId)) return 'assessorId must be a valid UUID'
  if (!isCompositionPositive(input.locations, isLocation)) {
    return 'locations must be a non-empty array of valid Location values'
  }
  if (!isCompositionMany(input.risks, isNote)) {
    return 'risks must be an array of valid Note values'
  }
  if (!isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

/** Validates JobAssessmentUpdate; returns error message or null. */
export const validateJobAssessmentUpdate = (
  input: JobAssessmentUpdate
): string | null => {
  if (!isId(input.id)) return 'id must be a valid UUID'
  if (input.jobId !== undefined && !isId(input.jobId)) {
    return 'jobId must be a valid UUID'
  }
  if (input.assessorId !== undefined && !isId(input.assessorId)) {
    return 'assessorId must be a valid UUID'
  }
  if (
    input.locations !== undefined && !isCompositionPositive(input.locations, isLocation)
  ) {
    return 'locations must be a non-empty array of valid Location values'
  }
  if (input.risks !== undefined && !isCompositionMany(input.risks, isNote)) {
    return 'risks must be an array of valid Note values'
  }
  if (input.notes !== undefined && !isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

/** Validates JobWorkflowCreate; returns error message or null. */
export const validateJobWorkflowCreate = (input: JobWorkflowCreate): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid UUID'
  if (!isId(input.basisWorkflowId)) return 'basisWorkflowId must be a valid UUID'
  if (input.modifiedWorkflowId !== undefined && !isId(input.modifiedWorkflowId)) {
    return 'modifiedWorkflowId must be a valid UUID'
  }
  return null
}

/** Validates JobWorkflowUpdate; returns error message or null. */
export const validateJobWorkflowUpdate = (input: JobWorkflowUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid UUID'
  if (input.jobId !== undefined && !isId(input.jobId)) {
    return 'jobId must be a valid UUID'
  }
  if (input.basisWorkflowId !== undefined && !isId(input.basisWorkflowId)) {
    return 'basisWorkflowId must be a valid UUID'
  }
  if (input.modifiedWorkflowId !== undefined && !isId(input.modifiedWorkflowId)) {
    return 'modifiedWorkflowId must be a valid UUID'
  }
  return null
}

/** Validates JobPlanCreate; returns error message or null. */
export const validateJobPlanCreate = (input: JobPlanCreate): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid UUID'
  if (!isWhen(input.scheduledStart)) return 'scheduledStart must be a valid ISO timestamp'
  if (input.scheduledEnd !== undefined && !isWhen(input.scheduledEnd)) {
    return 'scheduledEnd must be a valid ISO timestamp'
  }
  if (!isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

/** Validates JobPlanUpdate; returns error message or null. */
export const validateJobPlanUpdate = (input: JobPlanUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid UUID'
  if (input.jobId !== undefined && !isId(input.jobId)) {
    return 'jobId must be a valid UUID'
  }
  if (input.scheduledStart !== undefined && !isWhen(input.scheduledStart)) {
    return 'scheduledStart must be a valid ISO timestamp'
  }
  if (input.scheduledEnd !== undefined && !isWhen(input.scheduledEnd)) {
    return 'scheduledEnd must be a valid ISO timestamp'
  }
  if (input.notes !== undefined && !isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

/** Validates JobPlanAssignmentCreate; returns error message or null. */
export const validateJobPlanAssignmentCreate = (
  input: JobPlanAssignmentCreate
): string | null => {
  if (!isId(input.planId)) return 'planId must be a valid UUID'
  if (!isId(input.userId)) return 'userId must be a valid UUID'
  if (!isUserRole(input.role)) return 'role must be a valid UserRole'
  if (!isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

/** Validates JobPlanAssignmentUpdate; returns error message or null. */
export const validateJobPlanAssignmentUpdate = (
  input: JobPlanAssignmentUpdate
): string | null => {
  if (!isId(input.id)) return 'id must be a valid UUID'
  if (input.planId !== undefined && !isId(input.planId)) {
    return 'planId must be a valid UUID'
  }
  if (input.userId !== undefined && !isId(input.userId)) {
    return 'userId must be a valid UUID'
  }
  if (input.role !== undefined && !isUserRole(input.role)) {
    return 'role must be a valid UserRole'
  }
  if (input.notes !== undefined && !isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

/** Validates JobPlanChemicalCreate; returns error message or null. */
export const validateJobPlanChemicalCreate = (
  input: JobPlanChemicalCreate
): string | null => {
  if (!isId(input.planId)) return 'planId must be a valid UUID'
  if (!isId(input.chemicalId)) return 'chemicalId must be a valid UUID'
  if (typeof input.amount !== 'number' || input.amount <= 0) {
    return 'amount must be a positive number'
  }
  if (!isPlannedChemicalUnit(input.unit)) {
    return 'unit must be a valid PlannedChemicalUnit'
  }
  if (
    input.targetArea !== undefined
    && (typeof input.targetArea !== 'number' || input.targetArea <= 0)
  ) {
    return 'targetArea must be a positive number'
  }
  if (input.targetAreaUnit !== undefined && !isTargetAreaUnit(input.targetAreaUnit)) {
    return 'targetAreaUnit must be a valid TargetAreaUnit'
  }
  return null
}

/** Validates JobPlanChemicalUpdate; returns error message or null. */
export const validateJobPlanChemicalUpdate = (
  input: JobPlanChemicalUpdate
): string | null => {
  if (!isId(input.id)) return 'id must be a valid UUID'
  if (input.planId !== undefined && !isId(input.planId)) {
    return 'planId must be a valid UUID'
  }
  if (input.chemicalId !== undefined && !isId(input.chemicalId)) {
    return 'chemicalId must be a valid UUID'
  }
  if (
    input.amount !== undefined && (typeof input.amount !== 'number' || input.amount <= 0)
  ) {
    return 'amount must be a positive number'
  }
  if (input.unit !== undefined && !isPlannedChemicalUnit(input.unit)) {
    return 'unit must be a valid PlannedChemicalUnit'
  }
  if (
    input.targetArea !== undefined
    && (typeof input.targetArea !== 'number' || input.targetArea <= 0)
  ) {
    return 'targetArea must be a positive number'
  }
  if (input.targetAreaUnit !== undefined && !isTargetAreaUnit(input.targetAreaUnit)) {
    return 'targetAreaUnit must be a valid TargetAreaUnit'
  }
  return null
}

/** Validates JobWorkCreate; returns error message or null. */
export const validateJobWorkCreate = (input: JobWorkCreate): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid UUID'
  if (!isId(input.startedById)) return 'startedById must be a valid UUID'
  if (!isCompositionPositive(input.work, (v): v is string => isId(v))) {
    return 'work must be a non-empty array of valid UUID values'
  }
  if (!isWhen(input.startedAt)) return 'startedAt must be a valid ISO timestamp'
  if (input.completedAt !== undefined && !isWhen(input.completedAt)) {
    return 'completedAt must be a valid ISO timestamp'
  }
  return null
}

/** Validates JobWorkLogEntryCreate; returns error message or null. */
export const validateJobWorkLogEntryCreate = (
  input: JobWorkLogEntryCreate
): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid UUID'
  if (!isId(input.userId)) return 'userId must be a valid UUID'
  if (!isCompositionOne(input.answer, isAnswer)) {
    return 'answer must be a single valid Answer value'
  }
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATOR GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isJobStatus = (v: unknown): v is JobStatus =>
  typeof v === 'string' && (JOB_STATUSES as readonly string[]).includes(v)

const isUserRole = (v: unknown): v is UserRole =>
  typeof v === 'string' && (USER_ROLES as readonly string[]).includes(v)

const isPlannedChemicalUnit = (v: unknown): v is PlannedChemicalUnit =>
  typeof v === 'string' && (PLANNED_CHEMICAL_UNITS as readonly string[]).includes(v)

const isTargetAreaUnit = (v: unknown): v is TargetAreaUnit =>
  typeof v === 'string' && (TARGET_AREA_UNITS as readonly string[]).includes(v)

const isNote = (v: unknown): v is Dictionary => {
  const d = v as Dictionary
  return isNonEmptyString(d.content) && isWhen(d.createdAt)
    && Array.isArray(d.attachments)
}

const isLocation = (v: unknown): v is Dictionary => {
  const d = v as Dictionary
  return typeof d.latitude === 'number' && typeof d.longitude === 'number'
}

const isAnswerValue = (v: unknown): boolean =>
  typeof v === 'string'
  || typeof v === 'number'
  || typeof v === 'boolean'
  || (Array.isArray(v) && v.every((e): e is string => typeof e === 'string'))

const isAnswer = (v: unknown): v is Dictionary => {
  const d = v as Dictionary
  return isId(d.questionId)
    && isId(d.capturedById)
    && isAnswerValue(d.value)
    && isWhen(d.capturedAt)
    && isCompositionMany(d.notes, isNote)
}
