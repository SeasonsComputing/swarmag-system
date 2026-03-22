/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Common domain abstractions                                                  ║
║ Shared objects, const-enums, and Question union abstractions                ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines shared value objects and question abstractions used across topics.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Location                           Geographic position and address metadata.
ATTACHMENT_KINDS                   Allowed attachment kinds.
AttachmentKind                     Attachment kind union from const tuple.
Attachment                         Uploaded artifact metadata.
NOTE_VISIBILITIES                  Allowed note visibility values.
NoteVisibility                     Note visibility union from const tuple.
Note                               Freeform note with tags and attachments.
QUESTION_TYPES                     Canonical question discriminator values.
QuestionType                       Question discriminator union.
BaseQuestion                       Shared base for all question variants.
InternalQuestion                   System-generated question variant.
SCALAR_QUESTION_TYPES              Discriminator values for scalar questions.
ScalarQuestionType                 Scalar question type union.
ScalarQuestion                     Scalar question variant.
SelectOption                       Select option metadata.
SELECT_QUESTION_TYPES              Discriminator values for select questions.
SelectQuestionType                 Select question type union.
SelectQuestion                     Select question variant.
Question                           Discriminated union of question variants.
Answer                             Captured response payload for log entries.
*/

import type { AssociationOne, CompositionMany, CompositionPositive, Instantiable, When } from '@core/std'

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

/** Allowed attachment kinds. */
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
  createdAt: When
  content: string
  visibility: NoteVisibility
  tags: CompositionMany<string>
  attachments: CompositionMany<Attachment>
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

/** Scalar question discriminator values. */
export const SCALAR_QUESTION_TYPES = ['text', 'number', 'boolean'] as const
export type ScalarQuestionType = (typeof SCALAR_QUESTION_TYPES)[number]

/** Scalar input question variant. */
export type ScalarQuestion = BaseQuestion & {
  type: ScalarQuestionType
}

/** Select option metadata. */
export type SelectOption = {
  value: string
  label?: string
  requiresNote?: boolean
}

/** Select question discriminator values. */
export const SELECT_QUESTION_TYPES = ['single-select', 'multi-select'] as const
export type SelectQuestionType = (typeof SELECT_QUESTION_TYPES)[number]

/** Select input question variant. */
export type SelectQuestion = BaseQuestion & {
  type: SelectQuestionType
  options: CompositionPositive<SelectOption>
}

/** General-purpose prompt union used across tasks. */
export type Question = InternalQuestion | ScalarQuestion | SelectQuestion

/** Captured response payload tied to a question. */
export type Answer = {
  questionId: AssociationOne<Question>
  value: string | number | boolean | string[]
  capturedAt: When
  notes: CompositionMany<Note>
}
