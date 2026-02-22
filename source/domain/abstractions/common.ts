/**
 * Shared subordinate types used across multiple domain abstractions.
 * These are pure value objects with no independent lifecycle.
 */
import type { Id, When } from '@core-std'

/** Geographic position plus optional address and observation metadata. */
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
  id: Id
  filename: string
  url: string
  contentType: string
  kind: 'photo' | 'video' | 'map' | 'document'
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
  tags: [string?, ...string[]]
  attachments: [Attachment?, ...Attachment[]]
}
