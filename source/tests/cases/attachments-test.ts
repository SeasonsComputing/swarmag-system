/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Attachment feature tests                                                     ║
║ Verify recognition, upload tasks, placement after Save, links, and cancel.   ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { Config } from '@core/cfg/config.ts'
import { DocumentStore } from '@core/cli/docstore-client.ts'
import { Uploads } from '@core/cli/docstore-uploads.ts'
import { IndexedDbDocumentProvider } from '@core/cli/indexeddb-docstore-provider.ts'
import { id, ValidatorError } from '@core/std'
import type { Id } from '@core/std'
import { ApiError, DocumentAddresses } from '@core/stdx'
import type { Attachment, Note } from '@domain/abstractions/common.ts'
import { AttachmentFormats } from '@front/api/attachment-formats.ts'
import { Attachments as AttachmentsClass } from '@front/api/attachments.ts'
import { UploadTask } from '@front/api/upload-task.ts'
import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert'
import { BackgroundTasks } from '@ux/shell/runtime/background-tasks.ts'
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
      LOCAL_DB_NAME: 'attachments-app',
      ATTACHMENTS_SERVER_ROOT: 'offline-attachments',
      FIELD_BINDER_SERVER_ROOT: 'offline-binder',
      FIELD_BINDER_INBOX_DB_NAME: 'attachments-binder-inbox',
      FIELD_BINDER_DB_NAME: 'attachments-binder',
      DOCUMENT_INBOX_DB_NAME: 'attachments-inbox',
      ATTACHMENTS_TEST_SERVER: 'attachments-server'
    })[key],
  fail: message => {
    throw new Error(message)
  }
}, [
  'LOCAL_DB_NAME',
  'DOCUMENT_INBOX_DB_NAME',
  'ATTACHMENTS_SERVER_ROOT',
  'FIELD_BINDER_SERVER_ROOT',
  'FIELD_BINDER_INBOX_DB_NAME',
  'FIELD_BINDER_DB_NAME',
  'ATTACHMENTS_TEST_SERVER'
])
const { makeAttachmentSave } = await import('@front/app/shell/make-attachment-save.ts')
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
let persistenceRequests = 0
Object.defineProperty(navigator, 'storage', {
  configurable: true,
  value: {
    persist: () => {
      persistenceRequests++
      return Promise.resolve(true)
    }
  }
})
const Inbox = new DocumentStore(
  new IndexedDbDocumentProvider('DOCUMENT_INBOX_DB_NAME'),
  {
    linkLifetime: 5
  }
)
const Server = new DocumentStore(new IndexedDbDocumentProvider('ATTACHMENTS_TEST_SERVER'), {
  linkLifetime: 5
})
const Delivery = new Uploads(Inbox, Server)
const Attachments = new AttachmentsClass(Delivery, Inbox)

Deno.test('attachment recognition goes by extension through the format table', () => {
  const cases: [string, string, string][] = [
    ['photo.JPG', 'image/jpeg', 'photo'],
    ['photo.jpeg', 'image/jpeg', 'photo'],
    ['photo.png', 'image/png', 'photo'],
    ['photo.heic', 'image/heic', 'photo'],
    ['photo.heif', 'image/heif', 'photo'],
    ['photo.webp', 'image/webp', 'photo'],
    ['field.tif', 'image/tiff', 'map'],
    ['field.tiff', 'image/tiff', 'map'],
    ['order.pdf', 'application/pdf', 'document'],
    ['note.txt', 'text/plain', 'document'],
    ['note.md', 'text/markdown', 'document'],
    ['note.json', 'application/json', 'document']
  ]
  for (const [name, contentType, kind] of cases) {
    assertEquals(AttachmentFormats.recognize(new File(['x'], name, { type: 'text/html' })), {
      contentType,
      kind
    })
  }
  for (const name of ['bad.svg', 'bad.html', 'bad.xml', 'bad.gif', 'bad.avif', 'noextension']) {
    assertThrows(() => AttachmentFormats.recognize(new File(['x'], name)), ValidatorError)
  }
  assert(!AttachmentFormats.accept(['map']).includes('image/jpeg'))
  assertEquals(AttachmentFormats.accept(['video']), '')
  assertThrows(
    () => Attachments.stage(new File(['%PDF-'], 'file.pdf'), ['photo']),
    ValidatorError
  )
})

/** Wait until a chosen document's upload task has cleared or failed. */
const settled = async (attachment: Attachment): Promise<void> => {
  const key = `upload:${DocumentAddresses.id(attachment.documentAddress).document}`
  for (let tries = 0; tries < 500; tries++) {
    const task = BackgroundTasks.store[key]
    if (task === undefined || task.phase === 'failed') return
    await new Promise(resolve => setTimeout(resolve, 2))
  }
  throw new Error(`Upload task ${key} did not settle.`)
}

/** Whether a minted document id is still in this inbox's staging. */
const isStaging = async (attachment: Attachment): Promise<boolean> => {
  const minted = DocumentAddresses.id(attachment.documentAddress).document
  for (const namespace of await Inbox.namespace.list()) {
    if (namespace.name !== 'Staging') continue
    for (const bucket of await Inbox.bucket.list(namespace.id)) {
      const documents = await Inbox.document.list(bucket.id)
      if (documents.some(document => document.id.document === minted)) return true
    }
  }
  return false
}

/** A note holding one attachment. */
const noteOf = (attachment: Attachment): Note => ({
  content: 'Note',
  createdAt: attachment.uploadedAt,
  attachments: [attachment]
})

Deno.test('a chosen file is a staged row at once; Save gives it the placed address', async () => {
  const row = Attachments.stage(new File(['%PDF-body'], 'order.pdf', { type: 'text/html' }))
  const pending = DocumentAddresses.id(row.documentAddress)
  assertEquals(row.contentType, 'application/pdf')
  assert(Delivery.isStaged(pending))
  assertEquals(row.documentAddress, Delivery.stagedAddress(pending.document))
  const owner = id()
  const placed = Attachments.Customers.address(owner, [noteOf(row)])
  const reference = placed[0].attachments[0]
  const target = DocumentAddresses.id(reference.documentAddress)
  assertEquals(target.bucket, owner)
  assertEquals(target.document, pending.document)
  assertEquals(Attachments.Customers.address(owner, placed), placed)
  assertEquals(Attachments.Customers.address(undefined, [noteOf(row)])[0].attachments, [])
  const library = Attachments.Chemicals.address(undefined, [noteOf(row)])[0].attachments[0]
  assertEquals(DocumentAddresses.id(library.documentAddress).document, pending.document)
  Attachments.reset([pending.document])
  Attachments.Customers.address(owner, [noteOf(row)])
  await new Promise(resolve => setTimeout(resolve, 20))
  await assertRejects(() => Inbox.document.get(target), ApiError)
  Attachments.release([pending.document])
  await settled(row)
  assert(persistenceRequests > 0)
  const stored = await Inbox.document.get(target)
  assertEquals(stored.name, 'order.pdf')
  assertEquals(stored.count, 9)
  assertEquals((await Inbox.document.read(target)).type, 'application/pdf')
  assertEquals(await Attachments.size(reference), 9)
  assertEquals(await (await Attachments.file(reference)).text(), '%PDF-body')
})

Deno.test('links use inbox first, server on not-found, and propagate other failures', async () => {
  const row = Attachments.stage(new File(['hello'], 'hello.txt'))
  const placed = Attachments.Users.address(id(), [noteOf(row)])[0].attachments[0]
  Attachments.release([DocumentAddresses.id(row.documentAddress).document])
  await settled(row)
  const node = DocumentAddresses.id(placed.documentAddress)
  const first = await Attachments.link(placed)
  assertEquals(await (await fetch(first.url)).text(), 'hello')
  const ns = await Server.namespace.create('Users', node.namespace)
  const bucket = await Server.bucket.create(ns.id, 'Owner', node.bucket)
  await Server.document.create(
    bucket.id,
    placed.filename,
    await Inbox.document.read(node),
    node.document
  )
  await Inbox.document.delete(node)
  const second = await Attachments.link(placed)
  assertEquals(await (await fetch(second.url)).text(), 'hello')
  const failing = new AttachmentsClass(
    new Uploads({
      ...Inbox,
      document: { ...Inbox.document, link: () => Promise.reject(new ApiError('Unavailable', 503)) }
    }, Server),
    Inbox
  )
  await assertRejects(() => failing.link(placed), ApiError, 'Unavailable')
  await new Promise(resolve => setTimeout(resolve, 15))
})

/** Minimal record persisted by the save scenarios. */
type TestRecord = { id: Id; notes: readonly Note[] }
/** The form owns only its notes. */
type TestDraft = { notes: readonly Note[] }

/** A save over the Customers topic that records every write. */
const customerSave = (writes: TestDraft[], failUpdate = () => false) => {
  let record: TestRecord | undefined
  let reconciled: TestDraft | undefined
  const save = makeAttachmentSave<TestRecord, TestDraft>({
    create: draft => {
      writes.push(draft)
      record = { id: id(), ...draft }
      return Promise.resolve(record)
    },
    update: (owner, draft) => {
      if (failUpdate()) return Promise.reject(new Error('Injected update failure'))
      writes.push(draft)
      record = { ...owner, ...draft }
      return Promise.resolve(record)
    },
    address: (owner, draft) =>
      Promise.resolve({ notes: Attachments.Customers.address(owner, draft.notes) }),
    reconcile: draft => {
      reconciled = draft
    }
  }, Attachments)
  return { save, record: () => record, reconciled: () => reconciled }
}

Deno.test('a create leaves out new owner attachments, then adds them; placing follows', async () => {
  const writes: TestDraft[] = []
  const { save, reconciled } = customerSave(writes)
  const row = await save.stage(new File(['%PDF-'], 'create.pdf'))
  const saved = await save.create({ notes: [noteOf(row)] })
  assertEquals(writes.length, 2)
  assertEquals(writes[0].notes[0].attachments, [])
  const placed = saved.notes[0].attachments[0]
  assertEquals(DocumentAddresses.id(placed.documentAddress).bucket, saved.id)
  assertEquals(reconciled()!.notes, saved.notes)
  await settled(row)
  assertEquals((await Inbox.document.get(DocumentAddresses.id(placed.documentAddress))).count, 5)
})

Deno.test('an update writes placed addresses once', async () => {
  const writes: TestDraft[] = []
  const { save } = customerSave(writes)
  const existing = { id: id(), notes: [] }
  const row = await save.stage(new File(['%PDF-'], 'update.pdf'))
  const saved = await save.update(existing, { notes: [noteOf(row)] })
  assertEquals(writes.length, 1)
  assertEquals(DocumentAddresses.id(saved.notes[0].attachments[0].documentAddress).bucket, existing.id)
  await settled(row)
})

Deno.test('a failed completion retries the same record and places once', async () => {
  const writes: TestDraft[] = []
  let fail = true
  const { save, record } = customerSave(writes, () => fail)
  const row = await save.stage(new File(['%PDF-'], 'retry.pdf'))
  const draft = { notes: [noteOf(row)] }
  await assertRejects(() => save.create(draft), Error, 'Injected update failure')
  const persisted = record()!.id
  await new Promise(resolve => setTimeout(resolve, 20))
  assert(await isStaging(row))
  fail = false
  const saved = await save.create(draft)
  assertEquals(saved.id, persisted)
  assertEquals(writes.length, 2)
  await settled(row)
  const target = DocumentAddresses.id(saved.notes[0].attachments[0].documentAddress)
  assertEquals((await Inbox.document.get(target)).count, 5)
})

Deno.test('cancel before a write discards staging; after an attempt staging remains', async () => {
  const spec = {
    create: (_draft: TestDraft): Promise<TestRecord> => Promise.reject(new Error('Write refused')),
    update: (_record: TestRecord, _draft: TestDraft): Promise<TestRecord> =>
      Promise.reject(new Error('Write refused')),
    address: (_owner: Id | undefined, draft: TestDraft): Promise<TestDraft> => Promise.resolve(draft),
    reconcile: (_draft: TestDraft): void => {}
  }
  const save = makeAttachmentSave(spec, Attachments)
  const cancelled = await save.stage(new File(['cancel'], 'cancel.txt'))
  await save.discard()
  assert(!(await isStaging(cancelled)))
  const key = `upload:${DocumentAddresses.id(cancelled.documentAddress).document}`
  assertEquals(BackgroundTasks.store[key], undefined)
  const attempted = makeAttachmentSave(spec, Attachments)
  const retained = await attempted.stage(new File(['retain'], 'retain.txt'))
  await assertRejects(() => attempted.create({ notes: [noteOf(retained)] }), Error, 'Write refused')
  await attempted.discard()
  assert(await isStaging(retained))
})

Deno.test('cancel ends the task at once; the staged copy is discarded when the read completes', async () => {
  let finish = (): void => {}
  const reading = new Promise<void>(resolve => finish = resolve)
  const task = new UploadTask(Delivery, 'slow.txt', async report => {
    report(0, 4)
    await reading
    return new File(['slow'], 'slow.txt')
  })
  const key = `upload:${task.id}`
  assertEquals(BackgroundTasks.store[key]?.blocksExit, true)
  const abandoning = task.abandon(true)
  assertEquals(BackgroundTasks.store[key], undefined)
  finish()
  await abandoning
  assertEquals(BackgroundTasks.store[key], undefined)
  const staged = await task.staged
  assertEquals(staged?.id.document, task.id)
  await assertRejects(() => Inbox.document.get(staged!.id))
})
