/**
 * Common domain protocols.
 */

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type {
  ScalarQuestion,
  SelectQuestion
} from '@domain/abstractions/common.ts'

export type ScalarQuestionCreate = CreateFromInstantiable<ScalarQuestion>
export type SelectQuestionCreate = CreateFromInstantiable<SelectQuestion>
export type ScalarQuestionUpdate = UpdateFromInstantiable<ScalarQuestion>
export type SelectQuestionUpdate = UpdateFromInstantiable<SelectQuestion>

export type QuestionCreate = ScalarQuestionCreate | SelectQuestionCreate
export type QuestionUpdate = ScalarQuestionUpdate | SelectQuestionUpdate
