/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Common domain adapters                                                       ║
║ Dictionary serialization for common topic abstractions.                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Maps storage dictionaries to common abstractions and back.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
LocationAdapter      Deserialize/Serialize Location.
AttachmentAdapter    Deserialize/Serialize Attachment.
NoteAdapter          Deserialize/Serialize Note.
SelectOptionAdapter  Deserialize/Serialize SelectOption.
QuestionAdapter      Deserialize/Serialize Question.
AnswerAdapter        Deserialize/Serialize Answer.
*/

import { makeAdapter } from '@core/std'
import type {
  Answer,
  Attachment,
  Location,
  Note,
  Question,
  SelectOption
} from '@domain/abstractions/common.ts'

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

/** Deserialize/Serialize SelectOption. */
export const SelectOptionAdapter = makeAdapter<SelectOption>({
  value: ['value'],
  label: ['label'],
  requiresNote: ['requires_note']
})

/** Deserialize/Serialize Question. */
export const QuestionAdapter = makeAdapter<Question>({
  id: ['id'],
  createdAt: ['created_at'],
  updatedAt: ['updated_at'],
  deletedAt: ['deleted_at'],
  type: ['type'],
  prompt: ['prompt'],
  helpText: ['help_text'],
  required: ['required'],
  options: ['options', SelectOptionAdapter]
})

/** Deserialize/Serialize Answer. */
export const AnswerAdapter = makeAdapter<Answer>({
  questionId: ['question_id'],
  notes: ['notes', NoteAdapter],
  value: ['value'],
  capturedAt: ['captured_at']
})
