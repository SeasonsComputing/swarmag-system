/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Attachment document stores                                                   ║
║ The attachment inbox/server pair, its uploads, and Attachments over them.    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Binds the attachment document stores to their configured providers and composes
the attachment clients over them, for the application API namespace to include.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DocumentStoreAttachments  Attachment document stores and clients.
├ AttachmentsInbox        Device attachment inbox.
├ AttachmentsServer       Shared Supabase attachment store.
├ AttachmentsUploads      Durable capture, placement, access, and delivery.
└ Attachments             Recognition, catalog placement, and references.
*/

import { DocumentStore } from '@core/cli/docstore-client.ts'
import { Uploads } from '@core/cli/docstore-uploads.ts'
import { IndexedDbDocumentProvider } from '@core/cli/indexeddb-docstore-provider.ts'
import { SupabaseDocumentProvider } from '@core/cli/supabase-docstore-provider.ts'
import { Supabase } from '@core/db/supabase.ts'
import { Attachments } from './attachments.ts'

/** How long a minted document link stays valid: five minutes, in milliseconds. */
const StoreSettings = { linkLifetime: 5 * 60_000 }

/** The device's inbox: documents staged or placed and not yet uploaded. */
const AttachmentsInbox = new DocumentStore(
  new IndexedDbDocumentProvider('DOCUMENT_INBOX_DB_NAME'),
  StoreSettings
)

/** The shared document store, authorized by Storage policies. */
const AttachmentsServer = new DocumentStore(
  new SupabaseDocumentProvider(Supabase.client, 'ATTACHMENTS_SERVER_ROOT'),
  StoreSettings
)

/** Attachment delivery over the attachment pair. */
const AttachmentsUploads = new Uploads(AttachmentsInbox, AttachmentsServer)

/** Attachment document stores and clients, composed once for the API namespace. */
export const DocumentStoreAttachments = {
  AttachmentsInbox,
  AttachmentsServer,
  AttachmentsUploads,
  Attachments: new Attachments(AttachmentsUploads, AttachmentsInbox)
}
