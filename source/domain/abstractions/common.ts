/**
 * Common domain abstractions shared across the swarmAg system.
 */

import type {
  AssociationOne,
  CompositionMany,
  CompositionPositive,
  Id,
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

/** Uploaded artifact metadata. */
export type Attachment = {
  filename: string
  url: string
  contentType: string
  kind: AttachmentKind
  uploadedAt: When
  uploadedById: Id
}

/** Attachment classifications. */
export const ATTACHMENT_KINDS = ['photo', 'video', 'map', 'document'] as const
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number]

/** Freeform note with optional visibility and taxonomy. */
export type Note = {
  authorId: AssociationOne<User>
  attachments: CompositionMany<Attachment>
  createdAt: When
  content: string
  visibility?: NoteVisibility
  tags: CompositionMany<string>
}

/** Note visibility modes. */
export const NOTE_VISIBILITIES = ['internal', 'shared'] as const
export type NoteVisibility = (typeof NOTE_VISIBILITIES)[number]

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

/** Selectable option metadata for select questions. */
export type QuestionOption = {
  value: string
  label?: string
  requiresNote?: boolean
}

/** Scalar input question; no options. */
export type ScalarQuestion = Instantiable & {
  type: 'text' | 'number' | 'boolean' | 'internal'
  prompt: string
  helpText?: string
  required?: boolean
}

/** Select input question; options required and non-empty. */
export type SelectQuestion = Instantiable & {
  type: 'single-select' | 'multi-select'
  prompt: string
  helpText?: string
  required?: boolean
  options: CompositionPositive<QuestionOption>
}

/** Reusable prompt boundary type. */
export type Question = ScalarQuestion | SelectQuestion

/** Permitted answer value payloads. */
export type AnswerValue = string | number | boolean | string[]

/** Captured response to a question. */
export type Answer = {
  questionId: AssociationOne<Question>
  capturedById: AssociationOne<User>
  notes: CompositionMany<Note>
  value: AnswerValue
  capturedAt: When
}
