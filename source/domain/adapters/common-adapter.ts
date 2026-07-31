/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Common domain adapters                                                       ║
║ Dictionary serialization for shared value objects.                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Maps storage dictionaries to shared value objects and back.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
LocationAdapter      Deserialize/Serialize Location.
AttachmentAdapter    Deserialize/Serialize Attachment.
NoteAdapter          Deserialize/Serialize Note.
*/

import { makeAdapter } from '@core/stdx'
import type { Attachment, Location, Note } from '@domain/abstractions/common.ts'

/** Deserialize/Serialize Location. */
export const LocationAdapter = makeAdapter<Location>({
  latitude: ['latitude'],
  longitude: ['longitude'],
  altitudeMeters: ['altitude_meters'],
  line1: ['line1'],
  line2: ['line2'],
  city: ['city'],
  state: ['state'],
  postalCode: ['postal_code'],
  country: ['country'],
  recordedAt: ['recorded_at'],
  accuracyMeters: ['accuracy_meters'],
  description: ['description']
})

/** Deserialize/Serialize Attachment. */
export const AttachmentAdapter = makeAdapter<Attachment>({
  filename: ['filename'],
  url: ['url'],
  contentType: ['content_type'],
  kind: ['kind'],
  uploadedAt: ['uploaded_at']
})

/** Deserialize/Serialize Note. */
export const NoteAdapter = makeAdapter<Note>({
  attachments: ['attachments', AttachmentAdapter],
  createdAt: ['created_at'],
  content: ['content'],
  visibility: ['visibility'],
  tags: ['tags']
})
