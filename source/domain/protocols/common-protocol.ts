/**
 * Common domain protocols.
 */

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type {
  InternalQuestion,
  ScalarQuestion,
  SelectQuestion
} from '@domain/abstractions/common.ts'

export type InternalQuestionCreate = CreateFromInstantiable<InternalQuestion>
export type InternalQuestionUpdate = UpdateFromInstantiable<InternalQuestion>

export type ScalarQuestionCreate = CreateFromInstantiable<ScalarQuestion>
export type ScalarQuestionUpdate = UpdateFromInstantiable<ScalarQuestion>

export type SelectQuestionCreate = CreateFromInstantiable<SelectQuestion>
export type SelectQuestionUpdate = UpdateFromInstantiable<SelectQuestion>

export type QuestionCreate =
  | InternalQuestionCreate
  | ScalarQuestionCreate
  | SelectQuestionCreate

export type QuestionUpdate =
  | InternalQuestionUpdate
  | ScalarQuestionUpdate
  | SelectQuestionUpdate
