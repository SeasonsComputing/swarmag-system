/**
 * Shared value objects used across the swarmAg domain.
 * Location, Note, and Attachment have no independent lifecycle and are
 * embedded as compositions within owning abstractions.
 */

import type { CompositionMany, Id, When } from '@core-std'

/** Geographic position with optional address metadata. */
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

/** Kind of uploaded artifact. */
export type AttachmentKind = 'photo' | 'video' | 'map' | 'document'

/** Uploaded artifact metadata. */
export type Attachment = {
  id: Id
  filename: string
  url: string
  contentType: string
  kind: AttachmentKind
  uploadedAt: When
  uploadedById: Id
}

/** Freeform note with optional visibility, taxonomy, and attachments. */
export type Note = {
  id: Id
  createdAt: When
  authorId?: Id
  content: string
  visibility?: 'internal' | 'shared'
  tags: CompositionMany<string>
  attachments: CompositionMany<Attachment>
}
