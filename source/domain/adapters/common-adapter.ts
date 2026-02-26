/**
 * Common value object adapters to and from Dictionary representation.
 * Location, Note, and Attachment are composition helpers used by all
 * other adapters — they have no independent row-level lifecycle.
 */

import type { Dictionary, When } from '@core-std'
import type { Attachment, Location, Note } from '@domain/abstractions/common.ts'

/** Create a Location from serialized dictionary format */
export const toLocation = (dict: Dictionary): Location => ({
  latitude: dict.latitude as number,
  longitude: dict.longitude as number,
  altitudeMeters: dict.altitude_meters as number | undefined,
  line1: dict.line1 as string | undefined,
  line2: dict.line2 as string | undefined,
  city: dict.city as string | undefined,
  state: dict.state as string | undefined,
  postalCode: dict.postal_code as string | undefined,
  country: dict.country as string | undefined,
  recordedAt: dict.recorded_at as When | undefined,
  accuracyMeters: dict.accuracy_meters as number | undefined,
  description: dict.description as string | undefined
})

/** Serialize a Location to dictionary format */
export const fromLocation = (location: Location): Dictionary => ({
  latitude: location.latitude,
  longitude: location.longitude,
  altitude_meters: location.altitudeMeters,
  line1: location.line1,
  line2: location.line2,
  city: location.city,
  state: location.state,
  postal_code: location.postalCode,
  country: location.country,
  recorded_at: location.recordedAt,
  accuracy_meters: location.accuracyMeters,
  description: location.description
})

/** Create an Attachment from serialized dictionary format */
export const toAttachment = (dict: Dictionary): Attachment => ({
  id: dict.id as string,
  filename: dict.filename as string,
  url: dict.url as string,
  contentType: dict.content_type as string,
  kind: dict.kind as Attachment['kind'],
  uploadedAt: dict.uploaded_at as When,
  uploadedById: dict.uploaded_by_id as string
})

/** Serialize an Attachment to dictionary format */
export const fromAttachment = (attachment: Attachment): Dictionary => ({
  id: attachment.id,
  filename: attachment.filename,
  url: attachment.url,
  content_type: attachment.contentType,
  kind: attachment.kind,
  uploaded_at: attachment.uploadedAt,
  uploaded_by_id: attachment.uploadedById
})

/** Create a Note from serialized dictionary format */
export const toNote = (dict: Dictionary): Note => ({
  id: dict.id as string,
  createdAt: dict.created_at as When,
  authorId: dict.author_id as string | undefined,
  content: dict.content as string,
  visibility: dict.visibility as Note['visibility'],
  tags: (dict.tags as string[]) ?? [],
  attachments: ((dict.attachments as Dictionary[]) ?? []).map(toAttachment)
})

/** Serialize a Note to dictionary format */
export const fromNote = (note: Note): Dictionary => ({
  id: note.id,
  created_at: note.createdAt,
  author_id: note.authorId,
  content: note.content,
  visibility: note.visibility,
  tags: note.tags,
  attachments: note.attachments.map(fromAttachment)
})
