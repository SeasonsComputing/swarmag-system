/**
 * Protocols for the common domain area: Question create and update shapes.
 */

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type { Question } from '@domain/abstractions/common.ts'

/** Input for creating a Question. */
export type QuestionCreate = CreateFromInstantiable<Question>

/** Input for updating a Question. */
export type QuestionUpdate = UpdateFromInstantiable<Question>
