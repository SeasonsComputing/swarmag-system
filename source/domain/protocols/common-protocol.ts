/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Common protocol types                                                        ║
║ Boundary payload contracts for common topic abstractions.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines create and update protocol payload shapes for common abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
QuestionCreate  Union create payload for Question variants.
QuestionUpdate  Union update payload for Question variants.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { InternalQuestion, ScalarQuestion, SelectQuestion } from '@domain/abstractions/common.ts'

/*  Question Create protocol */
export type InternalQuestionCreate = CreateFromInstantiable<InternalQuestion>
export type ScalarQuestionCreate = CreateFromInstantiable<ScalarQuestion>
export type SelectQuestionCreate = CreateFromInstantiable<SelectQuestion>
export type QuestionCreate =
  | InternalQuestionCreate
  | ScalarQuestionCreate
  | SelectQuestionCreate

/* Question Update protocol */
export type InternalQuestionUpdate = UpdateFromInstantiable<InternalQuestion>
export type ScalarQuestionUpdate = UpdateFromInstantiable<ScalarQuestion>
export type SelectQuestionUpdate = UpdateFromInstantiable<SelectQuestion>
export type QuestionUpdate =
  | InternalQuestionUpdate
  | ScalarQuestionUpdate
  | SelectQuestionUpdate
