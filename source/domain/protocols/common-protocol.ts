/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Common protocol contracts                                                   ║
║ Create and update payload contracts for common topic abstractions           ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines boundary payload contracts for persisted common abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
InternalQuestionCreate             Create payload contract for InternalQuestion.
ScalarQuestionCreate               Create payload contract for ScalarQuestion.
SelectQuestionCreate               Create payload contract for SelectQuestion.
QuestionCreate                     Create payload contract for Question union.
InternalQuestionUpdate             Update payload contract for InternalQuestion.
ScalarQuestionUpdate               Update payload contract for ScalarQuestion.
SelectQuestionUpdate               Update payload contract for SelectQuestion.
QuestionUpdate                     Update payload contract for Question union.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { InternalQuestion, ScalarQuestion, SelectQuestion } from '@domain/abstractions/common.ts'

/** Create payload contract for Question. */
export type InternalQuestionCreate = CreateFromInstantiable<InternalQuestion>
export type ScalarQuestionCreate = CreateFromInstantiable<ScalarQuestion>
export type SelectQuestionCreate = CreateFromInstantiable<SelectQuestion>
export type QuestionCreate = InternalQuestionCreate | ScalarQuestionCreate | SelectQuestionCreate

/** Update payload contract for Question. */
export type InternalQuestionUpdate = UpdateFromInstantiable<InternalQuestion>
export type ScalarQuestionUpdate = UpdateFromInstantiable<ScalarQuestion>
export type SelectQuestionUpdate = UpdateFromInstantiable<SelectQuestion>
export type QuestionUpdate = InternalQuestionUpdate | ScalarQuestionUpdate | SelectQuestionUpdate
