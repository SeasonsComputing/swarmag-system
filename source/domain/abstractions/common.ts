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

/** Attachment kind classification. */
export const ATTACHMENT_KINDS = ['photo', 'video', 'map', 'document'] as const

/** Attachment kind value. */
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number]

/** Uploaded artifact metadata. */
export type Attachment = {
  filename: string
  url: string
  contentType: string
  kind: AttachmentKind
  uploadedAt: When
  uploadedById: Id
}

/** Note visibility scope. */
export const NOTE_VISIBILITIES = ['internal', 'shared'] as const

/** Note visibility value. */
export type NoteVisibility = (typeof NOTE_VISIBILITIES)[number]

/** Freeform note with optional visibility and taxonomy. */
export type Note = {
  createdAt: When
  authorId?: Id
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

/** Supported question input mode value. */
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

/** Select input question with non-empty options. */
export type SelectQuestion = Instantiable & {
  type: 'single-select' | 'multi-select'
  prompt: string
  helpText?: string
  required?: boolean
  options: CompositionPositive<QuestionOption>
}

/** Discriminated union boundary type for reusable prompts. */
export type Question = ScalarQuestion | SelectQuestion

/** Permitted answer payload values. */
export type AnswerValue = string | number | boolean | string[]

/** Captured response to a question with crew annotations. */
export type Answer = {
  questionId: AssociationOne<Question>
  capturedById: AssociationOne<User>
  value: AnswerValue
  capturedAt: When
  notes: CompositionMany<Note>
}
