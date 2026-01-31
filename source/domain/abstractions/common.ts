/**
 * Shared types and interfaces used across the swarmAg domain models.
 * These define common data structures for various domain abstractions.
 */

import type { ID, When } from '@utils'

/** Allowed role memberships for users. */
export const USER_ROLES = [
  'administrator',
  'sales',
  'operations'
] as const
export type UserRole = (typeof USER_ROLES)[number]

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

/** Represents a note or comment. */
export interface Note {
  id: ID
  createdAt: When
  authorId?: ID
  content: string
  visibility?: 'internal' | 'shared'
  tags?: string[]
  images: Attachment[]
}

/** Represents a location with coordinates and optional address fields. */
export interface Location {
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
  capturedById: ID
  note?: Note
}

/** Represents a file attachment. */
export interface Attachment {
  id: ID
  filename: string
  url: string
  contentType: string
  uploadedAt: When
  uploadedById: ID
}
