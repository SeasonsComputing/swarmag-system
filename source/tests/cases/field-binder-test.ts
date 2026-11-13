/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder source and preparation tests                                    ║
║ Verify publish before delivery, skipped entries as updates, and rename.      ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { Config } from '@core/cfg/config.ts'
import { DocumentStore } from '@core/cli/docstore-client.ts'
import { Uploads } from '@core/cli/docstore-uploads.ts'
import { IndexedDbDocumentProvider } from '@core/cli/indexeddb-docstore-provider.ts'
import { id, ValidatorError } from '@core/std'
import { FieldBinderMetadata } from '@front/api/field-binder-inventory.ts'
import type { FieldBinderEntry } from '@front/api/field-binder-inventory.ts'
import { FieldBinderSource } from '@front/api/field-binder-source.ts'
import { FieldBinder } from '@front/api/field-binder.ts'
import { UploadTask } from '@front/api/upload-task.ts'
import { assert, assertEquals, assertRejects } from '@std/assert'
import {
  IDBCursor,
  IDBCursorWithValue,
  IDBDatabase,
  IDBFactory,
  IDBIndex,
  IDBKeyRange,
  IDBObjectStore,
  IDBOpenDBRequest,
  IDBRequest,
  IDBTransaction,
  IDBVersionChangeEvent,
  indexedDB
} from 'fake-indexeddb'

Config.init({
  get: key =>
    ({
      FIELD_BINDER_INBOX_DB_NAME: 'field-binder-test-inbox',
      FIELD_BINDER_TEST_SERVER: 'field-binder-test-server',
      FIELD_BINDER_DB_NAME: 'field-binder-test-local'
    })[key],
  fail: message => {
    throw new Error(message)
  }
}, ['FIELD_BINDER_INBOX_DB_NAME', 'FIELD_BINDER_TEST_SERVER', 'FIELD_BINDER_DB_NAME'])
Object.assign(globalThis, {
  IDBCursor,
  IDBCursorWithValue,
  IDBDatabase,
  IDBFactory,
  IDBIndex,
  IDBKeyRange,
  IDBObjectStore,
  IDBOpenDBRequest,
  IDBRequest,
  IDBTransaction,
  IDBVersionChangeEvent,
  indexedDB
})
Object.defineProperty(navigator, 'storage', {
  configurable: true,
  value: { persist: () => Promise.resolve(true) }
})
// One tab: every lock is granted at once.
Object.defineProperty(navigator, 'locks', {
  configurable: true,
  value: {
    request: (name: string, options: unknown, callback?: (lock: Lock) => Promise<unknown>) =>
      (callback ?? options as (lock: Lock) => Promise<unknown>)({ name, mode: 'exclusive' })
  }
})

const Inbox = new DocumentStore(new IndexedDbDocumentProvider('FIELD_BINDER_INBOX_DB_NAME'), {
  linkLifetime: 5
})
const Server = new DocumentStore(new IndexedDbDocumentProvider('FIELD_BINDER_TEST_SERVER'), {
  linkLifetime: 5
})
const Local = new DocumentStore(new IndexedDbDocumentProvider('FIELD_BINDER_DB_NAME'), {
  linkLifetime: 5
})
const Delivery = new Uploads(Inbox, Server)
const Source = new FieldBinderSource(Delivery, Inbox, Server)

/** The current publication's reference, the baseline an editor saves against. */
const baseline = async (): Promise<string | undefined> => {
  const publication = await Source.publication()
  return publication ? FieldBinderMetadata.address(publication.document.id) : undefined
}

/** Choose a document and save its entry: published at once, with no transfer awaited. */
const add = async (
  name: string,
  text: string
): Promise<{ task: UploadTask; entry: FieldBinderEntry }> => {
  const task = Source.choose(name, UploadTask.fromFile(new File([text], name)))
  const entry: FieldBinderEntry = {
    id: id(),
    description: name,
    documentAddress: FieldBinderMetadata.placed(task.id),
    upload: { source: 'upload', kind: 'document' }
  }
  await Source.save(entry, await baseline())
  return { task, entry }
}

/** Place a saved entry's document and deliver it. */
const deliver = async (task: UploadTask): Promise<void> => {
  await Source.place(task)
  await Delivery.drain()
}

/** The ids of the entries a reader holds. */
const held = (binder: FieldBinder): readonly string[] => binder.store.entries.map(entry => entry.id)

Deno.test('Save publishes the entry before delivery; placing hands it to the drain', async () => {
  const { task, entry } = await add('manual.pdf', '%PDF-manual')
  const publication = await Source.publication()
  assert(publication!.inventory.entries.some(item => item.id === entry.id))
  assertEquals(await Source.document(entry), undefined)
  await Source.place(task)
  assertEquals(await Source.document(entry), undefined)
  assertEquals((await Inbox.document.get(FieldBinderMetadata.id(entry.documentAddress))).count, 11)
  await Delivery.drain()
  assertEquals((await Source.document(entry))!.name, 'manual.pdf')
})

Deno.test('a sync that skipped an undelivered entry reports an update, after a reload too', async () => {
  const delivered = await add('label.pdf', '%PDF-label')
  await deliver(delivered.task)
  const pending = await add('sheet.pdf', '%PDF-sheet')
  const binder = new FieldBinder(Local, Server, Source)
  await binder.sync()
  assert(held(binder).includes(delivered.entry.id))
  assert(!held(binder).includes(pending.entry.id))
  assertEquals(binder.store.updateAvailable, true)
  assertEquals(binder.status(), 'Available offline · Update available')
  const reloaded = new FieldBinder(Local, Server, Source)
  await reloaded.load()
  assert(!held(reloaded).includes(pending.entry.id))
  assertEquals(reloaded.store.updateAvailable, true)
  await deliver(pending.task)
  await binder.sync()
  assert(held(binder).includes(pending.entry.id))
  assertEquals(binder.store.updateAvailable, false)
  assert(binder.store.verifiedAt !== undefined)
})

Deno.test('rename changes the delivered document, and the next sync renames the local copy', async () => {
  const { task, entry } = await add('parts.pdf', '%PDF-parts')
  await deliver(task)
  const binder = new FieldBinder(Local, Server, Source)
  await binder.sync()
  const document = FieldBinderMetadata.id(entry.documentAddress)
  assertEquals((await Local.document.get(document)).name, 'parts.pdf')
  assertEquals((await Source.rename(entry, 'drone-parts.pdf')).name, 'drone-parts.pdf')
  assertEquals((await Source.document(entry))!.name, 'drone-parts.pdf')
  await binder.sync()
  assertEquals((await Local.document.get(document)).name, 'drone-parts.pdf')
  await assertRejects(() => Source.rename(entry, '.inventory.json'), ValidatorError)
})
