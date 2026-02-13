/**
 * Common domain abstractions, shared across the domain model
 */

import type { ID, When } from '@core-std'

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

/** Represents a file attachment. */
export interface Attachment {
  id: ID
  filename: string
  url: string
  contentType: string
  uploadedAt: When
  uploadedById: ID
}
