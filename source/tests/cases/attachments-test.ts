/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Attachment feature tests                                                     ║
║ Verify recognition, placement, links, cancellation, and interrupted saves.   ║
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
import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert'
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
      DOCUMENT_INBOX_DB_NAME: 'attachments-inbox',
      ATTACHMENTS_TEST_SERVER: 'attachments-server'
    })[key],
  fail: message => {
    throw new Error(message)
  }
}, ['LOCAL_DB_NAME', 'DOCUMENT_INBOX_DB_NAME', 'ATTACHMENTS_TEST_SERVER'])
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
const Inbox = new DocumentStore(new IndexedDbDocumentProvider('DOCUMENT_INBOX_DB_NAME'), {
  linkLifetime: 5
})
const Server = new DocumentStore(new IndexedDbDocumentProvider('ATTACHMENTS_TEST_SERVER'), {
  linkLifetime: 5
})
const Delivery = new Uploads(Inbox, Server)
const Attachments = new AttachmentsClass(Delivery, Inbox)

Deno.test('attachment recognition goes by extension through the format table', async () => {
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
  await assertRejects(
    () => Attachments.stage(new File(['%PDF-'], 'file.pdf'), ['photo']),
    ValidatorError
  )
})

Deno.test('durable staging and idempotent placement preserve reference metadata', async () => {
  const staged = await Attachments.stage(new File(['%PDF-body'], 'order.pdf', { type: 'text/html' }))
  assert(persistenceRequests > 0)
  const source = DocumentAddresses.id(staged.documentAddress)
  const reopened = new DocumentStore(new IndexedDbDocumentProvider('DOCUMENT_INBOX_DB_NAME'), {
    linkLifetime: 5
  })
  assertEquals(await (await reopened.document.read(source)).text(), '%PDF-body')
  assertEquals((await reopened.document.read(source)).type, 'application/pdf')
  const owner = id()
  const notes: Note[] = [{ content: 'Order', createdAt: staged.uploadedAt, attachments: [staged] }]
  const placed = await Attachments.Customers.place(owner, notes)
  const reference = placed[0].attachments[0]
  const target = DocumentAddresses.id(reference.documentAddress)
  assertEquals(target.bucket, owner)
  assertEquals(target.document, source.document)
  assert(target.namespace !== source.namespace)
  assertEquals(await Attachments.Customers.place(owner, notes), placed)
  assertEquals(await Attachments.Customers.place(owner, placed), placed)
  assertEquals(reference.uploadedAt, staged.uploadedAt)
  assertEquals(await Attachments.size(reference), 9)
  assertEquals((await Inbox.document.get(source)).count, 9)
  const renamed = { ...reference, filename: 'new-name.pdf' }
  assertEquals(await Attachments.size(renamed), 9)
  assertEquals((await Inbox.document.get(target)).name, 'order.pdf')
  await assertRejects(() => Attachments.discard([reference]), ValidatorError)
})

Deno.test('links use inbox first, server on not-found, and propagate other failures', async () => {
  const staged = await Attachments.stage(new File(['hello'], 'hello.txt'))
  const placed = (await Attachments.Users.place(id(), [{
    content: 'Hello',
    createdAt: staged.uploadedAt,
    attachments: [staged]
  }]))[0].attachments[0]
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

/** Minimal record persisted by the failure-injection scenarios. */
type TestRecord = { id: Id; notes: readonly Note[] }
/** The form owns only its notes. */
type TestDraft = { notes: readonly Note[] }

Deno.test('failed completion retries the same record and reconciles final references', async () => {
  let record: TestRecord | undefined
  let creates = 0
  let fail = true
  let editor: TestDraft = { notes: [] }
  const save = makeAttachmentSave<TestRecord, TestDraft>({
    create: draft => {
      creates++
      record = { id: id(), ...draft }
      return Promise.resolve(record)
    },
    update: (owner, draft) => {
      record = { ...owner, ...draft }
      return Promise.resolve(record)
    },
    place: async (owner, draft) => {
      if (fail) throw new Error('Injected placement interruption')
      return { notes: await Attachments.Customers.place(owner, draft.notes) }
    },
    reconcile: draft => {
      editor = draft
    }
  }, Attachments)
  const attachment = await save.stage(new File(['%PDF-'], 'retry.pdf'))
  editor = { notes: [{ content: 'Retry', createdAt: attachment.uploadedAt, attachments: [attachment] }] }
  await assertRejects(() => save.create(editor), Error, 'Injected placement interruption')
  const persistedId = record!.id
  await save.discard()
  assertEquals((await Inbox.document.get(DocumentAddresses.id(attachment.documentAddress))).count, 5)
  fail = false
  const saved = await save.create(editor)
  assertEquals(creates, 1)
  assertEquals(saved.id, persistedId)
  assertEquals(saved.notes, editor.notes)
  assert(saved.notes[0].attachments[0].documentAddress !== attachment.documentAddress)
  assertEquals(record!.notes, editor.notes)
})

Deno.test('cancel deletes only this editor staging before a write attempt', async () => {
  const spec = {
    create: (_draft: TestDraft): Promise<TestRecord> => Promise.reject(new Error('Write refused')),
    update: (_record: TestRecord, _draft: TestDraft): Promise<TestRecord> =>
      Promise.reject(new Error('Write refused')),
    place: (_owner: Id, draft: TestDraft): Promise<TestDraft> => Promise.resolve(draft),
    reconcile: (_draft: TestDraft): void => {}
  }
  const save = makeAttachmentSave(spec, Attachments)
  const file = await save.stage(new File(['cancel'], 'cancel.txt'))
  const other = await Attachments.stage(new File(['keep'], 'keep.txt'))
  await save.discard()
  await assertRejects(() => Inbox.document.get(DocumentAddresses.id(file.documentAddress)), ApiError)
  assertEquals(await Attachments.size(other), 4)
  const attempted = makeAttachmentSave(spec, Attachments)
  const retained = await attempted.stage(new File(['retain'], 'retain.txt'))
  await assertRejects(() => attempted.create({ notes: [] }), Error, 'Write refused')
  await attempted.discard()
  assertEquals(await Attachments.size(retained), 6)
})

Deno.test('final-reference write failure retains staging and retry converges', async () => {
  let stored: TestRecord | undefined
  let failFinalWrite = true
  let reconciled: TestDraft | undefined
  const save = makeAttachmentSave<TestRecord, TestDraft>({
    create: draft => {
      stored = { id: id(), ...draft }
      return Promise.resolve(stored)
    },
    update: (record, draft) => {
      if (failFinalWrite && draft.notes[0].attachments[0].documentAddress !== original.documentAddress) {
        return Promise.reject(new Error('Injected final-reference write failure'))
      }
      stored = { ...record, ...draft }
      return Promise.resolve(stored)
    },
    place: async (owner, draft) => ({ notes: await Attachments.Customers.place(owner, draft.notes) }),
    reconcile: draft => {
      reconciled = draft
    }
  }, Attachments)
  const original = await save.stage(new File(['%PDF-body'], 'partial.pdf'))
  const draft = {
    notes: [{ content: 'Partial', createdAt: original.uploadedAt, attachments: [original] }]
  }
  await assertRejects(() => save.create(draft), Error, 'Injected final-reference write failure')
  assertEquals(stored!.notes, draft.notes)
  assertEquals(reconciled, undefined)
  await save.discard()
  assertEquals(await Attachments.size(original), 9)
  const firstPlacement = await Attachments.Customers.place(stored!.id, draft.notes)
  const target = DocumentAddresses.id(firstPlacement[0].attachments[0].documentAddress)
  failFinalWrite = false
  const saved = await save.create(draft)
  assertEquals(saved.notes, reconciled!.notes)
  assertEquals(saved.notes, firstPlacement)
  const namespaces = await Inbox.namespace.list()
  const ns = namespaces.find(value => value.id.namespace === target.namespace)!
  const buckets = await Inbox.bucket.list(ns.id)
  const bucket = buckets.find(value => value.id.bucket === target.bucket)!
  assertEquals((await Inbox.document.list(bucket.id)).length, 1)
})

Deno.test('closing while staging is pending discards only the late unsaved document', async () => {
  let release: (() => void) | undefined
  const waiting = new Promise<void>(resolve => {
    release = resolve
  })
  const attachments = {
    stage: async (file: File): Promise<Attachment> => {
      await waiting
      return Attachments.stage(file)
    },
    discard: (staged: readonly Attachment[]) => Attachments.discard(staged)
  }
  const save = makeAttachmentSave<TestRecord, TestDraft>({
    create: draft => Promise.resolve({ id: id(), ...draft }),
    update: (record, draft) => Promise.resolve({ ...record, ...draft }),
    place: (_owner, draft) => Promise.resolve(draft),
    reconcile: () => {}
  }, attachments)
  const pending = save.stage(new File(['late'], 'late.txt'))
  await save.discard()
  release!()
  const late = await pending
  await assertRejects(() => Inbox.document.get(DocumentAddresses.id(late.documentAddress)), ApiError)
})
