/**
 * Common value objects shared across the swarmAg domain.
 * Location, Note, and Attachment are embedded subordinate compositions
 * with no independent lifecycle.
 */

import type { AssociationOne, CompositionMany, When } from '@core-std'
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
  kind: 'photo' | 'video' | 'map' | 'document'
  uploadedAt: When
  uploadedById: AssociationOne<User>
}

/** Freeform note with optional visibility and taxonomy. */
export type Note = {
  createdAt: When
  authorId?: AssociationOne<User>
  content: string
  visibility?: 'internal' | 'shared'
  tags: CompositionMany<string>
  attachments: CompositionMany<Attachment>
}
