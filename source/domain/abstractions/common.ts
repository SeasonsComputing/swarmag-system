/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Common domain abstractions                                                   ║
║ Canonical types for shared value objects and question models.                ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines shared domain value objects and reusable question abstractions.
*/

import type { AssociationOne, CompositionMany, CompositionPositive, Instantiable, When } from '@core/std'

/** Canonical field keys for Location. */
export const LOCATION_FIELDS = [
  'latitude',
  'longitude',
  'altitudeMeters',
  'line1',
  'line2',
  'city',
  'state',
  'postalCode',
  'country',
  'recordedAt',
  'accuracyMeters',
  'description'
] as const
export type LocationField = (typeof LOCATION_FIELDS)[number]

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

/** Allowed attachment kind values. */
export const ATTACHMENT_KINDS = ['photo', 'video', 'map', 'document'] as const
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number]

/** Uploaded artifact metadata. */
export type Attachment = {
  filename: string
  url: string
  contentType: string
  kind: AttachmentKind
  uploadedAt: When
}

/** Allowed note visibility values. */
export const NOTE_VISIBILITIES = ['internal', 'shared'] as const
export type NoteVisibility = (typeof NOTE_VISIBILITIES)[number]

/** Freeform note with visibility and taxonomy. */
export type Note = {
  attachments: CompositionMany<Attachment>
  createdAt: When
  content: string
  visibility: NoteVisibility
  tags: CompositionMany<string>
}

/** Supported question input modes. */
export const QUESTION_TYPES = [
  'internal',
  'text',
  'number',
  'boolean',
  'single-select',
  'multi-select'
] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

/** Scalar question discriminator values. */
export const SCALAR_QUESTION_TYPES = ['text', 'number', 'boolean'] as const
export type ScalarQuestionType = (typeof SCALAR_QUESTION_TYPES)[number]

/** Select question discriminator values. */
export const SELECT_QUESTION_TYPES = ['single-select', 'multi-select'] as const
export type SelectQuestionType = (typeof SELECT_QUESTION_TYPES)[number]

/** Common shape shared by all question constituents. */
export type BaseQuestion = Instantiable & {
  type: QuestionType
  prompt: string
  helpText?: string
  required?: boolean
}

/** System-generated question variant. */
export type InternalQuestion = BaseQuestion & {
  type: 'internal'
}

/** Scalar input question variant. */
export type ScalarQuestion = BaseQuestion & {
  type: ScalarQuestionType
}

/** Selectable option metadata. */
export type SelectOption = {
  value: string
  label?: string
  requiresNote?: boolean
}

/** Select input question variant with required options. */
export type SelectQuestion = BaseQuestion & {
  type: SelectQuestionType
  options: CompositionPositive<SelectOption>
}

/** Discriminated union of all question variants. */
export type Question = InternalQuestion | ScalarQuestion | SelectQuestion

/** Captured response to a question. */
export type Answer = {
  questionId: AssociationOne<Question>
  notes: CompositionMany<Note>
  value: string | number | boolean | string[]
  capturedAt: When
}
