/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Common domain abstractions                                                   ║
║ Canonical types for shared abstractions.                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines shared domain abstractions and value objects.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Location                    Place with coordinate and/or address substance.
CONTACT_PREFERRED_CHANNELS  Allowed contact communication channels.
ContactPreferredChannel     Channel type derived from CONTACT_PREFERRED_CHANNELS.
ATTACHMENT_KINDS            Allowed attachment kind values.
AttachmentKind              Attachment kind derived from ATTACHMENT_KINDS.
Attachment                  Uploaded artifact metadata.
Note                        Free form note.
Facet                       Curated classification catalog entry.
*/

import type { CompositionMany, Instantiable, When } from '@core/std'

/** Place with paired coordinates, address substance (line1+city), or both. */
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
  documentAddress: string
  contentType: string
  kind: AttachmentKind
  uploadedAt: When
}

/** Freeform note. */
export type Note = {
  attachments: CompositionMany<Attachment>
  createdAt: When
  content: string
}

/** Curated classification catalog entry: one code within a scheme. */
export type Facet = Instantiable & {
  scheme: string
  code: string
  label: string
  description?: string
  active: boolean
}
