/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Attachment feature tests                                                     ║
║ Verify recognition, placement, links, cancellation, and interrupted saves.   ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { Config } from '@core/cfg/config.ts'
import { DocumentStore } from '@core/cli/docstore-client.ts'
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
const Attachments = new AttachmentsClass(Inbox, Server)

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
  const staged = await Attachments.stage(new File(['%PDF-body'], 'order.pdf'))
  assert(persistenceRequests > 0)
  const source = DocumentAddresses.id(staged.documentAddress)
  const reopened = new DocumentStore(new IndexedDbDocumentProvider('DOCUMENT_INBOX_DB_NAME'), {
    linkLifetime: 5
  })
  assertEquals(await (await reopened.document.read(source)).text(), '%PDF-body')
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
  const failing = new AttachmentsClass({
    ...Inbox,
    document: { ...Inbox.document, link: () => Promise.reject(new ApiError('Unavailable', 503)) }
  }, Server)
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

Deno.test('drain preserves placed documents, retries interruptions, and tolerates concurrent reads', async context => {
  // Earlier placement tests share these stores; begin with no placed documents pending.
  await Attachments.drain()
  const place = async (text: string): Promise<Attachment> => {
    const staged = await Attachments.stage(new File([text], `${text}.txt`))
    const notes = await Attachments.Customers.place(id(), [{
      content: text,
      createdAt: staged.uploadedAt,
      attachments: [staged]
    }])
    return notes[0].attachments[0]
  }

  await context.step(
    'copy keeps ids, names, bytes and type; staging and empty containers stay',
    async () => {
      const staged = await Attachments.stage(new File(['staged'], 'staged.txt'))
      const attachment = await place('placed')
      const node = DocumentAddresses.id(attachment.documentAddress)
      const metadata = await Inbox.document.get(node)
      const ns = (await Inbox.namespace.list()).find(row => row.id.namespace === node.namespace)!
      const bucket = (await Inbox.bucket.list(ns.id)).find(row => row.id.bucket === node.bucket)!
      assertEquals(await Attachments.drain(), { drained: 1, remaining: 0 })
      assertEquals((await Server.namespace.get(ns.id)).name, ns.name)
      assertEquals((await Server.bucket.get(bucket.id)).name, bucket.name)
      assertEquals((await Server.document.get(node)).name, metadata.name)
      const body = await Server.document.read(node)
      assertEquals(await body.text(), 'placed')
      assertEquals(body.type, 'text/plain')
      await assertRejects(() => Inbox.document.get(node), ApiError)
      assertEquals((await Inbox.document.list(bucket.id)).length, 0)
      assertEquals((await Inbox.namespace.get(ns.id)).name, ns.name)
      assertEquals(await Attachments.size(staged), 6)
      await assertRejects(
        () => Server.document.get(DocumentAddresses.id(staged.documentAddress)),
        ApiError
      )
      assertEquals(await Attachments.drain(), { drained: 0, remaining: 0 })
      assertEquals(await Attachments.size(attachment), 6)
    }
  )

  await context.step('a failed copy retains its source and does not prevent other copies', async () => {
    const failed = await place('failed-copy')
    const good = await place('good-copy')
    const node = DocumentAddresses.id(failed.documentAddress)
    const create = Server.document.create
    Server.document.create = (parent, name, body, suppliedId) => {
      if (suppliedId === node.document) return Promise.reject(new ApiError('Injected copy failure', 503))
      return create(parent, name, body, suppliedId)
    }
    try {
      const error = await assertRejects(() => Attachments.drain(), AggregateError)
      assertEquals(error.errors.length, 1)
      assertEquals(await (await Inbox.document.read(node)).text(), 'failed-copy')
      assertEquals(
        await (await Server.document.read(DocumentAddresses.id(good.documentAddress))).text(),
        'good-copy'
      )
      await assertRejects(() => Inbox.document.get(DocumentAddresses.id(good.documentAddress)), ApiError)
    } finally {
      Server.document.create = create
    }
    assertEquals(await Attachments.drain(), { drained: 1, remaining: 0 })
  })

  await context.step('remaining counts documents placed after the pass snapshot', async () => {
    await place('snapshot')
    const create = Server.document.create
    let added = false
    Server.document.create = async (parent, name, body, suppliedId) => {
      const result = await create(parent, name, body, suppliedId)
      if (!added) {
        added = true
        await place('arrived-during-pass')
      }
      return result
    }
    try {
      assertEquals(await Attachments.drain(), { drained: 1, remaining: 1 })
    } finally {
      Server.document.create = create
    }
    assertEquals(await Attachments.drain(), { drained: 1, remaining: 0 })
  })

  await context.step(
    'a cut-off after copying retries without duplicating or replacing the server copy',
    async () => {
      const attachment = await place('delete-interrupted')
      const node = DocumentAddresses.id(attachment.documentAddress)
      const remove = Inbox.document.delete
      Inbox.document.delete = () => Promise.reject(new ApiError('Injected delete failure', 503))
      try {
        await assertRejects(() => Attachments.drain(), AggregateError)
        assertEquals(await (await Inbox.document.read(node)).text(), 'delete-interrupted')
      } finally {
        Inbox.document.delete = remove
      }
      const before = await Server.document.get(node)
      assertEquals(await Attachments.drain(), { drained: 1, remaining: 0 })
      assertEquals(await Server.document.get(node), before)
      assertEquals(await (await Server.document.read(node)).text(), 'delete-interrupted')
    }
  )

  await context.step(
    'a document removed after listing counts only when the server holds it',
    async () => {
      const attachment = await place('another-drain')
      const node = DocumentAddresses.id(attachment.documentAddress)
      const read = Inbox.document.read
      Inbox.document.read = async target => {
        if (target.document === node.document) {
          await new AttachmentsClass({ ...Inbox, document: { ...Inbox.document, read } }, Server).drain()
        }
        return read(target)
      }
      try {
        assertEquals(await Attachments.drain(), { drained: 1, remaining: 0 })
      } finally {
        Inbox.document.read = read
      }
      assertEquals(await Attachments.size(attachment), 13)
    }
  )

  await context.step('a missing source without a server copy is a failure', async () => {
    const attachment = await place('missing')
    const node = DocumentAddresses.id(attachment.documentAddress)
    const read = Inbox.document.read
    Inbox.document.read = async target => {
      if (target.document === node.document) await Inbox.document.delete(target)
      return read(target)
    }
    try {
      await assertRejects(() => Attachments.drain(), AggregateError)
    } finally {
      Inbox.document.read = read
    }
  })

  await context.step(
    'link and size fall back when their actual inbox operation races with a drain',
    async () => {
      const attachment = await place('read-race')
      const link = Inbox.document.link
      Inbox.document.link = async target => {
        await Attachments.drain()
        return link(target)
      }
      try {
        const result = await Attachments.link(attachment)
        assertEquals(await (await fetch(result.url)).text(), 'read-race')
        URL.revokeObjectURL(result.url)
      } finally {
        Inbox.document.link = link
      }
      const next = await place('size-race')
      const get = Inbox.document.get
      Inbox.document.get = async target => {
        await Attachments.drain()
        return get(target)
      }
      try {
        assertEquals(await Attachments.size(next), 9)
      } finally {
        Inbox.document.get = get
      }
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  )

  await context.step('staging 404s and other inbox errors never fall back', async () => {
    const staged = await Attachments.stage(new File(['private'], 'private.txt'))
    await Attachments.discard([staged])
    const link = Server.document.link
    const get = Server.document.get
    let fallbacks = 0
    Server.document.link = target => {
      fallbacks++
      return link(target)
    }
    Server.document.get = target => {
      fallbacks++
      return get(target)
    }
    const inboxLink = Inbox.document.link
    try {
      await assertRejects(() => Attachments.link(staged), ApiError)
      await assertRejects(() => Attachments.size(staged), ApiError)
      const attachment = await place('refused')
      Inbox.document.link = () => Promise.reject(new ApiError('Refused', 403))
      await assertRejects(() => Attachments.link(attachment), ApiError, 'Refused')
      assertEquals(fallbacks, 0)
    } finally {
      Server.document.link = link
      Server.document.get = get
      Inbox.document.link = inboxLink
    }
    await Attachments.drain()
  })
})
