/**
 * Common domain abstractions shared across topic areas.
 */

import type {
  AssociationOne,
  CompositionMany,
  CompositionPositive,
  Instantiable,
  When
} from '@core-std'
import type { User } from '@domain/abstractions/user.ts'

/** Geographic position plus optional address metadata. */
export type Location = {
  latitude: number
  longitude: number
  altitudeMeters?: number
  line1?: string
  line2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  recordedAt?: When
  accuracyMeters?: number
  description?: string
}

/** Attachment kind for uploaded artifacts. */
export const ATTACHMENT_KINDS = ['photo', 'video', 'map', 'document'] as const
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number]

/** Uploaded artifact metadata. */
export type Attachment = {
  filename: string
  url: string
  contentType: string
  kind: AttachmentKind
  uploadedAt: When
  uploadedById: AssociationOne<User>
}

/** Note visibility classification. */
export const NOTE_VISIBILITIES = ['internal', 'shared'] as const
export type NoteVisibility = (typeof NOTE_VISIBILITIES)[number]

/** Freeform note with optional visibility and tags. */
export type Note = {
  createdAt: When
  content: string
  visibility?: NoteVisibility
  tags: CompositionMany<string>
  attachments: CompositionMany<Attachment>
}

/** Supported question input modes. */
export const QUESTION_TYPES = [
  'text',
  'number',
  'boolean',
  'single-select',
  'multi-select',
  'internal'
] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

/** Scalar question input modes. */
export const SCALAR_QUESTION_TYPES = ['text', 'number', 'boolean', 'internal'] as const
export type ScalarQuestionType = (typeof SCALAR_QUESTION_TYPES)[number]

/** Select question input modes. */
export const SELECT_QUESTION_TYPES = ['single-select', 'multi-select'] as const
export type SelectQuestionType = (typeof SELECT_QUESTION_TYPES)[number]

/** Selectable option metadata for select-type questions. */
export type SelectableOption = {
  value: string
  label?: string
  requiresNote?: boolean
}

/** Scalar input question without options. */
export type ScalarQuestion = Instantiable & {
  type: ScalarQuestionType
  prompt: string
  helpText?: string
  required?: boolean
}

/** Select input question with a non-empty options set. */
export type SelectQuestion = Instantiable & {
  type: SelectQuestionType
  prompt: string
  helpText?: string
  required?: boolean
  options: CompositionPositive<SelectableOption>
}

/** Reusable prompt abstraction represented as a discriminated union. */
export type Question = ScalarQuestion | SelectQuestion

/** Captured response to a question with optional crew annotations. */
export type Answer = {
  questionId: AssociationOne<Question>
  value: string | number | boolean | string[]
  capturedAt: When
  capturedById: AssociationOne<User>
  notes: CompositionMany<Note>
}
