/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Common protocol validators                                                   ║
║ Boundary validation for shared abstraction payload shapes.                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates shared value objects and Facet protocol payloads.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
isLocation(v)                  Guard for Location object values.
isAttachment(v)                Guard for Attachment object values.
isNote(v)                      Guard for Note object values.
isFacetRef(v)                  Guard for scheme:code references.
validateFacetCreate(input)     Validate FacetCreate payloads.
validateFacetUpdate(input)     Validate FacetUpdate payloads.
*/

import {
  expectBoolean,
  expectCompositionMany,
  expectConstEnum,
  expectId,
  expectNonEmptyString,
  type ExpectResult,
  expectValid,
  expectWhen,
  isNonEmptyString
} from '@core/std'
import type { Attachment, Location, Note } from '@domain/abstractions/common.ts'
import { ATTACHMENT_KINDS, NOTE_VISIBILITIES } from '@domain/abstractions/common.ts'
import type { FacetCreate, FacetUpdate } from '@domain/protocols/common-protocol.ts'

/** Guard for Location with paired coordinates or address substance (line1+city). */
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
    expectConstEnum(note.visibility, 'visibility', NOTE_VISIBILITIES)
  ) === null
}

/** Guard for scheme:code references with exactly one separator. */
export const isFacetRef = (v: unknown): v is string => {
  if (typeof v !== 'string') return false
  const parts = v.split(':')
  return parts.length === 2 && parts.every(isNonEmptyString)
}

/** Validate FacetCreate payloads. */
export const validateFacetCreate = (input: FacetCreate): ExpectResult =>
  expectValid(
    expectFacetKey(input.scheme, 'scheme'),
    expectFacetKey(input.code, 'code'),
    expectNonEmptyString(input.label, 'label'),
    expectNonEmptyString(input.description, 'description', true),
    expectBoolean(input.active, 'active')
  )

/** Validate FacetUpdate payloads. */
export const validateFacetUpdate = (input: FacetUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectFacetKey(input.scheme, 'scheme', true),
    expectFacetKey(input.code, 'code', true),
    expectNonEmptyString(input.label, 'label', true),
    expectNonEmptyString(input.description, 'description', true),
    expectBoolean(input.active, 'active', true)
  )

// ────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ────────────────────────────────────────────────────────────────────────────

const expectFacetKey = (value: unknown, field: string, optional = false): ExpectResult => {
  const error = expectNonEmptyString(value, field, optional)
  if (error) return error
  if (typeof value === 'string' && value.includes(':')) return `${field} must not contain :`
  return null
}
