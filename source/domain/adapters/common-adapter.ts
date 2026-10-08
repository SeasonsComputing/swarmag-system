/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Common domain adapters                                                       ║
║ Dictionary serialization for shared abstractions.                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Maps storage dictionaries to shared abstractions and back.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
LocationAdapter      Deserialize/Serialize Location.
AttachmentAdapter    Deserialize/Serialize Attachment.
NoteAdapter          Deserialize/Serialize Note.
FacetAdapter         Deserialize/Serialize Facet.
*/

import { InstantiableAdapt, makeAdapter } from '@core/stdx'
import type { Attachment, Facet, Location, Note } from '@domain/abstractions/common.ts'

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
  visibility: ['visibility']
})

/** Deserialize/Serialize Facet. */
export const FacetAdapter = makeAdapter<Facet>({
  ...InstantiableAdapt,
  scheme: ['scheme'],
  code: ['code'],
  label: ['label'],
  description: ['description'],
  active: ['active']
})
