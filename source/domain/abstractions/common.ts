/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Common domain abstractions                                                   ║
║ Canonical types for shared value objects.                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines shared domain value objects.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
LOCATION_FIELDS             Canonical field keys for Location.
LocationField               Location field derived from LOCATION_FIELDS.
Location                    Place with coordinate and/or address substance.
CONTACT_PREFERRED_CHANNELS  Allowed contact communication channels.
ContactPreferredChannel     Channel type derived from CONTACT_PREFERRED_CHANNELS.
ATTACHMENT_KINDS            Allowed attachment kind values.
AttachmentKind              Attachment kind derived from ATTACHMENT_KINDS.
Attachment                  Uploaded artifact metadata.
NOTE_VISIBILITIES           Allowed note visibility values.
NoteVisibility              Note visibility derived from NOTE_VISIBILITIES.
Note                        Freeform note with visibility and taxonomy.
*/

import type { CompositionMany, When } from '@core/std'

/** Place carrying coordinate substance (latitude+longitude) or address substance (line1+city), or both; a present coordinate must be paired. */
export type Location = {
  latitude?: number
  longitude?: number
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

/** Allowed contact communication channels. */
export const CONTACT_PREFERRED_CHANNELS = ['email', 'text', 'phone'] as const
export type ContactPreferredChannel = (typeof CONTACT_PREFERRED_CHANNELS)[number]

/** Allowed attachment kind values. */
export const ATTACHMENT_KINDS = ['photo', 'video', 'map', 'document'] as const
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number]

/** Uploaded artifact metadata. */
export type Attachment = {
  filename: string
  url: string
  contentType: string
  kind: AttachmentKind
  uploadedAt: When
}

/** Allowed note visibility values. */
export const NOTE_VISIBILITIES = ['internal', 'shared'] as const
export type NoteVisibility = (typeof NOTE_VISIBILITIES)[number]

/** Freeform note with visibility and taxonomy. */
export type Note = {
  attachments: CompositionMany<Attachment>
  createdAt: When
  content: string
  visibility: NoteVisibility
  tags: CompositionMany<string>
}
