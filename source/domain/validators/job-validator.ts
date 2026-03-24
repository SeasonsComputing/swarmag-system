/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Job protocol validators                                                      ║
║ Boundary validation for job protocol payloads.                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for job abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateJobCreate(input)                Validate JobCreate payloads.
validateJobUpdate(input)                Validate JobUpdate payloads.
validateJobAssessmentCreate(input)      Validate JobAssessmentCreate payloads.
validateJobAssessmentUpdate(input)      Validate JobAssessmentUpdate payloads.
validateJobWorkflowCreate(input)        Validate JobWorkflowCreate payloads.
validateJobWorkflowUpdate(input)        Validate JobWorkflowUpdate payloads.
validateJobPlanCreate(input)            Validate JobPlanCreate payloads.
validateJobPlanUpdate(input)            Validate JobPlanUpdate payloads.
validateJobPlanAssignmentCreate(input)  Validate JobPlanAssignmentCreate payloads.
validateJobPlanAssignmentUpdate(input)  Validate JobPlanAssignmentUpdate payloads.
validateJobPlanChemicalCreate(input)    Validate JobPlanChemicalCreate payloads.
validateJobPlanChemicalUpdate(input)    Validate JobPlanChemicalUpdate payloads.
validateJobPlanAssetCreate(input)       Validate JobPlanAssetCreate payloads.
validateJobWorkCreate(input)            Validate JobWorkCreate payloads.
validateJobWorkUpdate(input)            Validate JobWorkUpdate payloads.
validateJobWorkLogEntryCreate(input)    Validate JobWorkLogEntryCreate payloads.
*/

import {
  expectCompositionMany,
  expectCompositionOne,
  expectCompositionPositive,
  expectConstEnum,
  expectId,
  expectPositiveNumber,
  type ExpectResult,
  expectValid,
  expectWhen,
  isId
} from '@core/std'
import {
  JOB_PLAN_CHEMICAL_UNITS,
  JOB_PLAN_TARGET_AREA_UNITS,
  JOB_STATUSES
} from '@domain/abstractions/job.ts'
import { USER_ROLES } from '@domain/abstractions/user.ts'
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
import { isAnswer, isLocation, isNote } from '@domain/validators/common-validator.ts'

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
    expectWhen(input.scheduledAt, 'scheduledAt'),
    expectWhen(input.startedAt, 'startedAt', true),
    expectWhen(input.completedAt, 'completedAt', true),
    expectId(input.jobId, 'jobId'),
    expectId(input.assessorId, 'assessorId'),
    expectCompositionPositive(input.locations, 'locations', isLocation),
    expectCompositionMany(input.risks, 'risks', isNote),
    expectCompositionMany(input.notes, 'notes', isNote)
  )

/** Validate JobAssessmentUpdate payloads. */
export const validateJobAssessmentUpdate = (input: JobAssessmentUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectWhen(input.scheduledAt, 'scheduledAt', true),
    expectWhen(input.startedAt, 'startedAt', true),
    expectWhen(input.completedAt, 'completedAt', true),
    expectId(input.jobId, 'jobId', true),
    expectId(input.assessorId, 'assessorId', true),
    expectCompositionPositive(input.locations, 'locations', isLocation, true),
    expectCompositionMany(input.risks, 'risks', isNote, true),
    expectCompositionMany(input.notes, 'notes', isNote, true)
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
    expectCompositionMany(input.notes, 'notes', isNote),
    expectWhen(input.scheduledStart, 'scheduledStart'),
    expectPositiveNumber(input.durationEstimate, 'durationEstimate')
  )

/** Validate JobPlanUpdate payloads. */
export const validateJobPlanUpdate = (input: JobPlanUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectId(input.jobId, 'jobId', true),
    expectId(input.plannerId, 'plannerId', true),
    expectCompositionMany(input.notes, 'notes', isNote, true),
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
    expectCompositionMany(input.notes, 'notes', isNote),
    expectConstEnum(input.role, 'role', USER_ROLES)
  )

/** Validate JobPlanAssignmentUpdate payloads. */
export const validateJobPlanAssignmentUpdate = (
  input: JobPlanAssignmentUpdate
): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectId(input.planId, 'planId', true),
    expectId(input.crewMemberId, 'crewMemberId', true),
    expectCompositionMany(input.notes, 'notes', isNote, true),
    expectConstEnum(input.role, 'role', USER_ROLES, true)
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
  expectValid(
    expectId(input.planId, 'planId'),
    expectId(input.assetId, 'assetId')
  )

/** Validate JobWorkCreate payloads. */
export const validateJobWorkCreate = (input: JobWorkCreate): ExpectResult =>
  expectValid(
    expectId(input.jobId, 'jobId'),
    expectId(input.startedById, 'startedById'),
    expectCompositionPositive(input.work, 'work', isId),
    expectWhen(input.startedAt, 'startedAt'),
    expectWhen(input.completedAt, 'completedAt', true)
  )

/** Validate JobWorkUpdate payloads. */
export const validateJobWorkUpdate = (input: JobWorkUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectId(input.jobId, 'jobId', true),
    expectId(input.startedById, 'startedById', true),
    expectCompositionPositive(input.work, 'work', isId, true),
    expectWhen(input.startedAt, 'startedAt', true),
    expectWhen(input.completedAt, 'completedAt', true)
  )

/** Validate JobWorkLogEntryCreate payloads. */
export const validateJobWorkLogEntryCreate = (
  input: JobWorkLogEntryCreate
): ExpectResult =>
  expectValid(
    expectId(input.jobId, 'jobId'),
    expectId(input.userId, 'userId'),
    expectCompositionOne(input.answer, 'answer', isAnswer)
  )
