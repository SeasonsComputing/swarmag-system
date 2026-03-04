/**
 * Common domain protocols.
 */

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type {
  ScalarQuestion,
  SelectQuestion
} from '@domain/abstractions/common.ts'

type ScalarQuestionCreate = CreateFromInstantiable<ScalarQuestion>
type SelectQuestionCreate = CreateFromInstantiable<SelectQuestion>
type ScalarQuestionUpdate = UpdateFromInstantiable<ScalarQuestion>
type SelectQuestionUpdate = UpdateFromInstantiable<SelectQuestion>

export type QuestionCreate = ScalarQuestionCreate | SelectQuestionCreate
export type QuestionUpdate = ScalarQuestionUpdate | SelectQuestionUpdate
