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
QuestionCreate                     Create payload contract for Question.
QuestionUpdate                     Update payload contract for Question.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { Question } from '@domain/abstractions/common.ts'

/** Create payload contract for Question. */
export type QuestionCreate = CreateFromInstantiable<Question>

/** Update payload contract for Question. */
export type QuestionUpdate = UpdateFromInstantiable<Question>
