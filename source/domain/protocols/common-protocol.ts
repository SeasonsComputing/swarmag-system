/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Common protocol shapes                                                       ║
║ Create and update payloads for common topic abstractions.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines create and update protocol shapes for Question — the only
Instantiable abstraction in the common topic namespace. Create and update
shapes are discriminated unions mirroring the Question union type.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
InternalQuestionCreate  Create payload for an InternalQuestion.
ScalarQuestionCreate    Create payload for a ScalarQuestion.
SelectQuestionCreate    Create payload for a SelectQuestion.
QuestionCreate          Discriminated union of all question create payloads.
InternalQuestionUpdate  Update payload for an InternalQuestion.
ScalarQuestionUpdate    Update payload for a ScalarQuestion.
SelectQuestionUpdate    Update payload for a SelectQuestion.
QuestionUpdate          Discriminated union of all question update payloads.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type {
  InternalQuestion,
  ScalarQuestion,
  SelectQuestion
} from '@domain/abstractions/common.ts'

// ────────────────────────────────────────────────────────────────────────────
// PROTOCOL
// ────────────────────────────────────────────────────────────────────────────

export type InternalQuestionCreate = CreateFromInstantiable<InternalQuestion>
export type ScalarQuestionCreate = CreateFromInstantiable<ScalarQuestion>
export type SelectQuestionCreate = CreateFromInstantiable<SelectQuestion>

/** Discriminated union of all question create payloads. */
export type QuestionCreate = InternalQuestionCreate | ScalarQuestionCreate | SelectQuestionCreate

export type InternalQuestionUpdate = UpdateFromInstantiable<InternalQuestion>
export type ScalarQuestionUpdate = UpdateFromInstantiable<ScalarQuestion>
export type SelectQuestionUpdate = UpdateFromInstantiable<SelectQuestion>

/** Discriminated union of all question update payloads. */
export type QuestionUpdate = InternalQuestionUpdate | ScalarQuestionUpdate | SelectQuestionUpdate
