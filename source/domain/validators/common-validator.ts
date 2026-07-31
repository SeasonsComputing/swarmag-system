/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Common protocol validators                                                   ║
║ Boundary validation for shared value object payload shapes.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Exports validation guards for shared value objects.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
isLocation(v)                  Guard for Location object values.
isAttachment(v)                Guard for Attachment object values.
isNote(v)                      Guard for Note object values.
*/

import {
  expectCompositionMany,
  expectConstEnum,
  expectNonEmptyString,
  expectValid,
  expectWhen,
  isNonEmptyString
} from '@core/std'
import {
  type Attachment,
  ATTACHMENT_KINDS,
  type Location,
  type Note,
  NOTE_VISIBILITIES
} from '@domain/abstractions/common.ts'

/** Guard for Location values: coordinate substance (latitude+longitude) or address substance (line1+city). */
export const isLocation = (v: unknown): v is Location => {
  if (v === null || typeof v !== 'object') return false
  const location = v as Location
  if (
    expectValid(
      expectNonEmptyString(location.line1, 'line1', true),
      expectNonEmptyString(location.line2, 'line2', true),
      expectNonEmptyString(location.city, 'city', true),
      expectNonEmptyString(location.state, 'state', true),
      expectNonEmptyString(location.postalCode, 'postalCode', true),
      expectNonEmptyString(location.country, 'country', true),
      expectWhen(location.recordedAt, 'recordedAt', true)
    ) !== null
  ) return false
  const hasCoordinates = typeof location.latitude === 'number' && typeof location.longitude === 'number'
  const coordinatesAbsent = location.latitude == null && location.longitude == null
  const hasAddress = isNonEmptyString(location.line1) && isNonEmptyString(location.city)
  return hasCoordinates || (coordinatesAbsent && hasAddress)
}

/** Guard for Attachment values. */
export const isAttachment = (v: unknown): v is Attachment => {
  if (v === null || typeof v !== 'object') return false
  const attachment = v as Attachment
  return expectValid(
    expectNonEmptyString(attachment.filename, 'filename'),
    expectNonEmptyString(attachment.url, 'url'),
    expectNonEmptyString(attachment.contentType, 'contentType'),
    expectConstEnum(attachment.kind, 'kind', ATTACHMENT_KINDS),
    expectWhen(attachment.uploadedAt, 'uploadedAt')
  ) === null
}

/** Guard for Note values. */
export const isNote = (v: unknown): v is Note => {
  if (v === null || typeof v !== 'object') return false
  const note = v as Note
  return expectValid(
    expectCompositionMany(note.attachments, 'attachments', isAttachment),
    expectWhen(note.createdAt, 'createdAt'),
    expectNonEmptyString(note.content, 'content'),
    expectConstEnum(note.visibility, 'visibility', NOTE_VISIBILITIES),
    expectCompositionMany(note.tags, 'tags', isNonEmptyString)
  ) === null
}
