/**
 * Shared types and interfaces used across the swarmAg domain models.
 * These define common data structures for various domain abstractions.
 */

import type { When } from '@utils/datetime.ts'
import type { ID } from '@utils/identifier.ts'

/** Allowed role memberships for users. */
export const USER_ROLES = [
  'administrator',
  'sales',
  'operations',
] as const
export type UserRole = (typeof USER_ROLES)[number]

/** Contexts where an author attribution role is used. */
export type AuthorAttributionContext =
  | 'customer-account'
  | 'job-assessment'
  | 'job-plan'
  | 'job-log'
  | 'asset'

/** Curated roles for attribution; avoid free-form labels. */
export const AUTHOR_ATTRIBUTION_ROLES = [
  { id: 'account-executive', label: 'Account Executive', contexts: ['customer-account'] },
  { id: 'assessment-lead', label: 'Assessment Lead', contexts: ['job-assessment'] },
  { id: 'crew-lead', label: 'Crew Lead', contexts: ['job-plan', 'job-log'] },
  { id: 'field-tech', label: 'Field Tech', contexts: ['job-log', 'asset'] },
  { id: 'fleet-manager', label: 'Fleet Manager', contexts: ['asset'] },
] as const satisfies ReadonlyArray<{
  id: string
  label: string
  contexts: readonly AuthorAttributionContext[]
}>

export type AuthorAttributionRole = (typeof AUTHOR_ATTRIBUTION_ROLES)[number]
export type AuthorAttributionRoleId = AuthorAttributionRole['id']

/** Represents a user in the system. */
export interface User {
  id: ID
  displayName: string
  primaryEmail: string
  phoneNumber: string
  avatarUrl?: string
  roles?: UserRole[]
  status?: 'active' | 'inactive'
  createdAt?: When
  updatedAt?: When
  deletedAt?: When
}

/** A subset of User information for authorship. */
export type Author = Pick<User, 'id' | 'displayName' | 'roles'> & { role?: AuthorAttributionRoleId }

/** Represents a note or comment. */
export interface Note {
  id: ID
  createdAt: When
  author?: Author
  content: string
  visibility?: 'internal' | 'shared'
  tags?: string[]
  images: Attachment[];
}

/** Represents geographic coordinates. */
export interface Coordinate {
  latitude: number
  longitude: number
  altitudeMeters?: number
}

/** Represents a physical address. */
export interface Address {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

/** Represents a location with coordinate and optional address. */
export interface Location {
  coordinate: Coordinate
  address?: Address
  recordedAt?: When
  accuracyMeters?: number
  description?: string
}

/** The types of questions that can be asked. */
export type QuestionType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'single-select'
  | 'multi-select'

/** An option for a multiple choice question. */
export interface QuestionOption {
  value: string
  label?: string
  requiresNote?: boolean
}

/** Represents a question in an assessment or form. */
export interface Question {
  id: ID
  prompt: string
  type: QuestionType
  helpText?: string
  required?: boolean
  options?: QuestionOption[]
}

/** The value of an answer. */
export type AnswerValue = string | number | boolean | string[]

/** An answer to a question. */
export interface Answer {
  questionId: ID
  value: AnswerValue
  capturedAt: When
  capturedBy: Author
  note?: Note
}

/** Represents a file attachment. */
export type AttachmentKind = 'photo' | 'video' | 'map' | 'document'

export interface Attachment {
  id: ID
  filename: string
  url: string
  kind: AttachmentKind
  uploadedAt: When
  uploadedBy: Author
}
