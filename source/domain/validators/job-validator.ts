/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Job protocol validators                                                     ║
║ Boundary validation for job protocol payloads                               ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update payloads for job lifecycle protocol contracts.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateJobCreate                   Validate JobCreate payloads.
validateJobUpdate                   Validate JobUpdate payloads.
validateJobAssessmentCreate         Validate JobAssessmentCreate payloads.
validateJobAssessmentUpdate         Validate JobAssessmentUpdate payloads.
validateJobWorkflowCreate           Validate JobWorkflowCreate payloads.
validateJobWorkflowUpdate           Validate JobWorkflowUpdate payloads.
validateJobPlanCreate               Validate JobPlanCreate payloads.
validateJobPlanUpdate               Validate JobPlanUpdate payloads.
validateJobPlanAssignmentCreate     Validate JobPlanAssignmentCreate payloads.
validateJobPlanAssignmentUpdate     Validate JobPlanAssignmentUpdate payloads.
validateJobPlanChemicalCreate       Validate JobPlanChemicalCreate payloads.
validateJobPlanChemicalUpdate       Validate JobPlanChemicalUpdate payloads.
validateJobPlanAssetCreate          Validate JobPlanAssetCreate payloads.
validateJobWorkCreate               Validate JobWorkCreate payloads.
validateJobWorkUpdate               Validate JobWorkUpdate payloads.
validateJobWorkLogEntryCreate       Validate JobWorkLogEntryCreate payloads.
*/

import {
  expectCompositionMany,
  expectCompositionOne,
  expectCompositionPositive,
  expectConstEnum,
  expectId,
  expectNonEmptyString,
  expectPositiveNumber,
  type ExpectResult,
  expectValid,
  expectWhen
} from '@core/std'
import {
  JOB_PLAN_CHEMICAL_UNITS,
  JOB_PLAN_TARGET_AREA_UNITS,
  JOB_STATUSES
} from '@domain/abstractions/job.ts'
import type {
  JobAssessmentCreate,
  JobAssessmentUpdate,
  JobCreate,
  JobPlanAssetCreate,
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
  JobWorkLogEntryCreate,
  JobWorkUpdate
} from '@domain/protocols/job-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validate JobCreate payloads. */
export const validateJobCreate = (input: JobCreate): ExpectResult =>
  expectValid(
    expectId(input.customerId, 'customerId'),
    expectConstEnum(input.status, 'status', JOB_STATUSES)
  )

/** Validate JobUpdate payloads. */
export const validateJobUpdate = (input: JobUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectId(input.customerId, 'customerId', true),
    expectConstEnum(input.status, 'status', JOB_STATUSES, true)
  )

/** Validate JobAssessmentCreate payloads. */
export const validateJobAssessmentCreate = (input: JobAssessmentCreate): ExpectResult =>
  expectValid(
    expectId(input.jobId, 'jobId'),
    expectId(input.assessorId, 'assessorId'),
    expectWhen(input.scheduledAt, 'scheduledAt'),
    expectWhen(input.startedAt, 'startedAt', true),
    expectWhen(input.completedAt, 'completedAt', true),
    expectCompositionPositive(input.locations, 'locations', isObject),
    expectCompositionMany(input.risks, 'risks', isObject),
    expectCompositionMany(input.notes, 'notes', isObject)
  )

/** Validate JobAssessmentUpdate payloads. */
export const validateJobAssessmentUpdate = (input: JobAssessmentUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectId(input.jobId, 'jobId', true),
    expectId(input.assessorId, 'assessorId', true),
    expectWhen(input.scheduledAt, 'scheduledAt', true),
    expectWhen(input.startedAt, 'startedAt', true),
    expectWhen(input.completedAt, 'completedAt', true),
    expectCompositionPositive(input.locations, 'locations', isObject, true),
    expectCompositionMany(input.risks, 'risks', isObject, true),
    expectCompositionMany(input.notes, 'notes', isObject, true)
  )

/** Validate JobWorkflowCreate payloads. */
export const validateJobWorkflowCreate = (input: JobWorkflowCreate): ExpectResult =>
  expectValid(
    expectId(input.jobId, 'jobId'),
    expectId(input.basisWorkflowId, 'basisWorkflowId'),
    expectId(input.modifiedWorkflowId, 'modifiedWorkflowId', true)
  )

/** Validate JobWorkflowUpdate payloads. */
export const validateJobWorkflowUpdate = (input: JobWorkflowUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectId(input.jobId, 'jobId', true),
    expectId(input.basisWorkflowId, 'basisWorkflowId', true),
    expectId(input.modifiedWorkflowId, 'modifiedWorkflowId', true)
  )

/** Validate JobPlanCreate payloads. */
export const validateJobPlanCreate = (input: JobPlanCreate): ExpectResult =>
  expectValid(
    expectId(input.jobId, 'jobId'),
    expectId(input.plannerId, 'plannerId'),
    expectCompositionMany(input.notes, 'notes', isObject),
    expectWhen(input.scheduledStart, 'scheduledStart'),
    expectPositiveNumber(input.durationEstimate, 'durationEstimate')
  )

/** Validate JobPlanUpdate payloads. */
export const validateJobPlanUpdate = (input: JobPlanUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectId(input.jobId, 'jobId', true),
    expectId(input.plannerId, 'plannerId', true),
    expectCompositionMany(input.notes, 'notes', isObject, true),
    expectWhen(input.scheduledStart, 'scheduledStart', true),
    expectPositiveNumber(input.durationEstimate, 'durationEstimate', true)
  )

/** Validate JobPlanAssignmentCreate payloads. */
export const validateJobPlanAssignmentCreate = (
  input: JobPlanAssignmentCreate
): ExpectResult =>
  expectValid(
    expectId(input.planId, 'planId'),
    expectId(input.crewMemberId, 'crewMemberId'),
    expectCompositionMany(input.notes, 'notes', isObject),
    expectNonEmptyString(input.role, 'role')
  )

/** Validate JobPlanAssignmentUpdate payloads. */
export const validateJobPlanAssignmentUpdate = (
  input: JobPlanAssignmentUpdate
): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectId(input.planId, 'planId', true),
    expectId(input.crewMemberId, 'crewMemberId', true),
    expectCompositionMany(input.notes, 'notes', isObject, true),
    expectNonEmptyString(input.role, 'role', true)
  )

/** Validate JobPlanChemicalCreate payloads. */
export const validateJobPlanChemicalCreate = (input: JobPlanChemicalCreate): ExpectResult =>
  expectValid(
    expectId(input.planId, 'planId'),
    expectId(input.chemicalId, 'chemicalId'),
    expectPositiveNumber(input.amount, 'amount'),
    expectConstEnum(input.unit, 'unit', JOB_PLAN_CHEMICAL_UNITS),
    expectPositiveNumber(input.targetArea, 'targetArea', true),
    expectConstEnum(input.targetAreaUnit, 'targetAreaUnit', JOB_PLAN_TARGET_AREA_UNITS)
  )

/** Validate JobPlanChemicalUpdate payloads. */
export const validateJobPlanChemicalUpdate = (input: JobPlanChemicalUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectId(input.planId, 'planId', true),
    expectId(input.chemicalId, 'chemicalId', true),
    expectPositiveNumber(input.amount, 'amount', true),
    expectConstEnum(input.unit, 'unit', JOB_PLAN_CHEMICAL_UNITS, true),
    expectPositiveNumber(input.targetArea, 'targetArea', true),
    expectConstEnum(input.targetAreaUnit, 'targetAreaUnit', JOB_PLAN_TARGET_AREA_UNITS, true)
  )

/** Validate JobPlanAssetCreate payloads. */
export const validateJobPlanAssetCreate = (input: JobPlanAssetCreate): ExpectResult =>
  expectValid(expectId(input.planId, 'planId'), expectId(input.assetId, 'assetId'))

/** Validate JobWorkCreate payloads. */
export const validateJobWorkCreate = (input: JobWorkCreate): ExpectResult =>
  expectValid(
    expectId(input.jobId, 'jobId'),
    expectId(input.startedById, 'startedById'),
    expectCompositionPositive(input.work, 'work', isIdString),
    expectWhen(input.startedAt, 'startedAt'),
    expectWhen(input.completedAt, 'completedAt', true)
  )

/** Validate JobWorkUpdate payloads. */
export const validateJobWorkUpdate = (input: JobWorkUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectId(input.jobId, 'jobId', true),
    expectId(input.startedById, 'startedById', true),
    expectCompositionPositive(input.work, 'work', isIdString, true),
    expectWhen(input.startedAt, 'startedAt', true),
    expectWhen(input.completedAt, 'completedAt', true)
  )

/** Validate JobWorkLogEntryCreate payloads. */
export const validateJobWorkLogEntryCreate = (input: JobWorkLogEntryCreate): ExpectResult =>
  expectValid(
    expectId(input.jobId, 'jobId'),
    expectId(input.userId, 'userId'),
    expectCompositionOne(input.answer, 'answer', isObject)
  )

// ────────────────────────────────────────────────────────────────────────────
// GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isObject = (value: unknown): value is object =>
  value !== null && typeof value === 'object'
const isIdString = (value: unknown): value is string => typeof value === 'string'
