/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Common domain abstractions                                                   ║
║ Shared types used across the swarmAg domain.                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines embedded value objects and reusable primitives shared across the
swarmAg domain: locations, attachments, notes, questions, and answers.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
Location              Geographic position plus optional address metadata.
ATTACHMENT_KINDS      Canonical attachment kind values.
AttachmentKind        Attachment kind union type.
Attachment            Uploaded artifact metadata.
NOTE_VISIBILITIES     Canonical note visibility values.
NoteVisibility        Note visibility union type.
Note                  Freeform note with visibility and taxonomy.
QUESTION_TYPES        Canonical question type values.
QuestionType          Question type discriminator.
BaseQuestion          Common shape shared by all Question constituents.
ScalarQuestionType    Derived scalar question kind type.
ScalarQuestion        Scalar input question; no options.
SelectOption          Selectable option metadata.
SelectQuestionType    Derived select question kind type.
SelectQuestion        Select input question; options required and non-empty.
InternalQuestion      System-generated question; referenced directly by log entries.
Question              Discriminated union of all question types.
Answer                Captured response to a question.
*/

import type {
  AssociationOne,
  CompositionMany,
  CompositionPositive,
  Instantiable,
  When
} from '@core-std'

// ────────────────────────────────────────────────────────────────────────────
// LOCATION
// ────────────────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────────────────
// ATTACHMENT
// ────────────────────────────────────────────────────────────────────────────

/** Canonical attachment kind values. */
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

// ────────────────────────────────────────────────────────────────────────────
// NOTE
// ────────────────────────────────────────────────────────────────────────────

/** Canonical note visibility values. */
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

// ────────────────────────────────────────────────────────────────────────────
// QUESTION
// ────────────────────────────────────────────────────────────────────────────

/** Canonical question type values. */
export const QUESTION_TYPES = [
  'internal',
  'text',
  'number',
  'boolean',
  'single-select',
  'multi-select'
] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

/** Common shape shared by all Question constituents. */
export type BaseQuestion = Instantiable & {
  type: QuestionType
  prompt: string
  helpText?: string
  required?: boolean
}

/** Derived scalar question kind type. */
export type ScalarQuestionType = Extract<QuestionType, 'text' | 'number' | 'boolean'>

/** Scalar input question; no options. */
export type ScalarQuestion = BaseQuestion & {
  type: ScalarQuestionType
}

/** Selectable option metadata; only valid on SelectQuestion. */
export type SelectOption = {
  value: string
  label?: string
  requiresNote?: boolean
}

/** Derived select question kind type. */
export type SelectQuestionType = Extract<QuestionType, 'single-select' | 'multi-select'>

/** Select input question; options required and non-empty. */
export type SelectQuestion = BaseQuestion & {
  type: SelectQuestionType
  options: CompositionPositive<SelectOption>
}

/** System-generated question; seed records referenced directly by log entries. */
export type InternalQuestion = BaseQuestion & {
  type: 'internal'
}

/** Discriminated union of all question types. */
export type Question = InternalQuestion | ScalarQuestion | SelectQuestion

// ────────────────────────────────────────────────────────────────────────────
// ANSWER
// ────────────────────────────────────────────────────────────────────────────

/** Captured response to a question; notes carry crew annotations and attachments. */
export type Answer = {
  questionId: AssociationOne<Question>
  value: string | number | boolean | string[]
  capturedAt: When
  notes: CompositionMany<Note>
}
