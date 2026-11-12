/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder document stores                                                 ║
║ The Binder inbox/server pair, its local mirror, and the clients over them.   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Binds the Field Binder document stores to their configured providers and
composes the Binder clients over them, for the application API namespace to
include. The Binder pair is independent of the attachment pair.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DocumentStoreFieldBinder  Field Binder document stores and clients.
├ FieldBinderInbox        Independent Binder staging and pending delivery.
├ FieldBinderServer       Remote Binder source.
├ FieldBinderStore        Complete local reader mirror.
├ FieldBinderUploads      Uploads over the Binder pair.
├ FieldBinderSource       Source inventory management.
└ FieldBinder             Local reader and explicit complete preparation.
*/

import { DocumentStore } from '@core/cli/docstore-client.ts'
import { Uploads } from '@core/cli/docstore-uploads.ts'
import { IndexedDbDocumentProvider } from '@core/cli/indexeddb-docstore-provider.ts'
import { SupabaseDocumentProvider } from '@core/cli/supabase-docstore-provider.ts'
import { Supabase } from '@core/db/supabase.ts'
import { FieldBinderSource } from './field-binder-source.ts'
import { FieldBinder } from './field-binder.ts'

/** How long a minted document link stays valid: five minutes, in milliseconds. */
const StoreSettings = { linkLifetime: 5 * 60_000 }

/** The device's Binder inbox: documents staged or placed and not yet delivered. */
const FieldBinderInbox = new DocumentStore(
  new IndexedDbDocumentProvider('FIELD_BINDER_INBOX_DB_NAME'),
  StoreSettings
)

/** The remote Binder source, authorized by Storage policies. */
const FieldBinderServer = new DocumentStore(
  new SupabaseDocumentProvider(Supabase.client, 'FIELD_BINDER_SERVER_ROOT'),
  StoreSettings
)

/** The device's complete local mirror, which the reader opens. */
const FieldBinderStore = new DocumentStore(
  new IndexedDbDocumentProvider('FIELD_BINDER_DB_NAME'),
  StoreSettings
)

/** Binder delivery over the Binder pair. */
const FieldBinderUploads = new Uploads(FieldBinderInbox, FieldBinderServer)

/** Source inventory management, which the reader's preparation also reads. */
const Source = new FieldBinderSource(FieldBinderUploads, FieldBinderInbox, FieldBinderServer)

/** Field Binder document stores and clients, composed once for the API namespace. */
export const DocumentStoreFieldBinder = {
  FieldBinderInbox,
  FieldBinderServer,
  FieldBinderStore,
  FieldBinderUploads,
  FieldBinderSource: Source,
  FieldBinder: new FieldBinder(FieldBinderStore, FieldBinderServer, Source)
}
