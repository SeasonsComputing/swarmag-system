/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Job domain validator                                                         ║
║ Boundary validation for job topic abstractions.                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for all job-related abstractions.
JobPlanAsset and JobWorkLogEntry have create validators only.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
validateJobCreate                  Validate JobCreate payloads.
validateJobUpdate                  Validate JobUpdate payloads.
validateJobAssessmentCreate        Validate JobAssessmentCreate payloads.
validateJobAssessmentUpdate        Validate JobAssessmentUpdate payloads.
validateJobWorkflowCreate          Validate JobWorkflowCreate payloads.
validateJobWorkflowUpdate          Validate JobWorkflowUpdate payloads.
validateJobPlanCreate              Validate JobPlanCreate payloads.
validateJobPlanUpdate              Validate JobPlanUpdate payloads.
validateJobPlanAssignmentCreate    Validate JobPlanAssignmentCreate payloads.
validateJobPlanAssignmentUpdate    Validate JobPlanAssignmentUpdate payloads.
validateJobPlanChemicalCreate      Validate JobPlanChemicalCreate payloads.
validateJobPlanChemicalUpdate      Validate JobPlanChemicalUpdate payloads.
validateJobPlanAssetCreate         Validate JobPlanAssetCreate payloads.
validateJobWorkCreate              Validate JobWorkCreate payloads.
validateJobWorkUpdate              Validate JobWorkUpdate payloads.
validateJobWorkLogEntryCreate      Validate JobWorkLogEntryCreate payloads.
*/

import {
  expectCompositionMany,
  expectCompositionOne,
  expectCompositionPositive,
  expectConstEnum,
  type ExpectGuard,
  expectId,
  expectPositiveNumber,
  type ExpectResult,
  expectValid,
  expectWhen
} from '@core/std'
import type { Answer, Note } from '@domain/abstractions/common.ts'
import { AREA_UNITS, CHEMICAL_AMOUNT_UNITS, JOB_STATUSES } from '@domain/abstractions/job.ts'
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
import { isLocation, isNote } from '@domain/validators/common-validator.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validate JobCreate payloads. */
export const validateJobCreate = (input: JobCreate): ExpectResult =>
  expectValid(
    expectId(input.customerId, 'customerId'),
    expectConstEnum(input.status, 'status', JOB_STATUSES, true)
  )

/** Validate JobUpdate payloads. */
export const validateJobUpdate = (input: JobUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectConstEnum(input.status, 'status', JOB_STATUSES, true)
  )

/** Validate JobAssessmentCreate payloads. */
export const validateJobAssessmentCreate = (input: JobAssessmentCreate): ExpectResult =>
  expectValid(
    expectId(input.jobId, 'jobId'),
    expectId(input.assessorId, 'assessorId'),
    expectCompositionPositive(input.locations, 'locations', isLocation),
    expectCompositionMany(input.risks, 'risks', isNote as ExpectGuard<Note>, true),
    expectCompositionMany(input.notes, 'notes', isNote as ExpectGuard<Note>, true)
  )

/** Validate JobAssessmentUpdate payloads. */
export const validateJobAssessmentUpdate = (input: JobAssessmentUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectId(input.assessorId, 'assessorId', true),
    expectCompositionPositive(input.locations, 'locations', isLocation, true),
    expectCompositionMany(input.risks, 'risks', isNote as ExpectGuard<Note>, true),
    expectCompositionMany(input.notes, 'notes', isNote as ExpectGuard<Note>, true)
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
    expectId(input.modifiedWorkflowId, 'modifiedWorkflowId', true)
  )

/** Validate JobPlanCreate payloads. */
export const validateJobPlanCreate = (input: JobPlanCreate): ExpectResult =>
  expectValid(
    expectId(input.jobId, 'jobId'),
    expectId(input.plannerId, 'plannerId'),
    expectCompositionMany(input.notes, 'notes', isNote as ExpectGuard<Note>, true),
    expectWhen(input.scheduledStart, 'scheduledStart'),
    expectWhen(input.scheduledEnd, 'scheduledEnd', true)
  )

/** Validate JobPlanUpdate payloads. */
export const validateJobPlanUpdate = (input: JobPlanUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectId(input.plannerId, 'plannerId', true),
    expectCompositionMany(input.notes, 'notes', isNote as ExpectGuard<Note>, true),
    expectWhen(input.scheduledStart, 'scheduledStart', true),
    expectWhen(input.scheduledEnd, 'scheduledEnd', true)
  )

/** Validate JobPlanAssignmentCreate payloads. */
export const validateJobPlanAssignmentCreate = (input: JobPlanAssignmentCreate): ExpectResult =>
  expectValid(
    expectId(input.planId, 'planId'),
    expectId(input.crewMemberId, 'crewMemberId'),
    expectCompositionMany(input.notes, 'notes', isNote as ExpectGuard<Note>, true),
    expectConstEnum(input.role, 'role', USER_ROLES)
  )

/** Validate JobPlanAssignmentUpdate payloads. */
export const validateJobPlanAssignmentUpdate = (input: JobPlanAssignmentUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectCompositionMany(input.notes, 'notes', isNote as ExpectGuard<Note>, true),
    expectConstEnum(input.role, 'role', USER_ROLES, true)
  )

/** Validate JobPlanChemicalCreate payloads. */
export const validateJobPlanChemicalCreate = (input: JobPlanChemicalCreate): ExpectResult =>
  expectValid(
    expectId(input.planId, 'planId'),
    expectId(input.chemicalId, 'chemicalId'),
    expectPositiveNumber(input.amount, 'amount'),
    expectConstEnum(input.unit, 'unit', CHEMICAL_AMOUNT_UNITS),
    expectPositiveNumber(input.targetArea, 'targetArea', true),
    expectConstEnum(input.targetAreaUnit, 'targetAreaUnit', AREA_UNITS, true)
  )

/** Validate JobPlanChemicalUpdate payloads. */
export const validateJobPlanChemicalUpdate = (input: JobPlanChemicalUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectPositiveNumber(input.amount, 'amount', true),
    expectConstEnum(input.unit, 'unit', CHEMICAL_AMOUNT_UNITS, true),
    expectPositiveNumber(input.targetArea, 'targetArea', true),
    expectConstEnum(input.targetAreaUnit, 'targetAreaUnit', AREA_UNITS, true)
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
    expectWhen(input.completedAt, 'completedAt', true)
  )

/** Validate JobWorkLogEntryCreate payloads. */
export const validateJobWorkLogEntryCreate = (input: JobWorkLogEntryCreate): ExpectResult =>
  expectValid(
    expectId(input.jobId, 'jobId'),
    expectId(input.userId, 'userId'),
    expectCompositionOne(input.answer, 'answer', isAnswer)
  )

// ────────────────────────────────────────────────────────────────────────────
// GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isId: ExpectGuard<string> = (v): v is string => typeof v === 'string' && v.length > 0

const isAnswer: ExpectGuard<Answer> = (v): v is Answer => v !== null && typeof v === 'object'
