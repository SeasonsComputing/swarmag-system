/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Upload lifecycle tests                                                       ║
║ Verify durable capture, isolated delivery, interruption, and access races.   ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { Config } from '@core/cfg/config.ts'
import { DocumentStore } from '@core/cli/docstore-client.ts'
import { Uploads } from '@core/cli/docstore-uploads.ts'
import { IndexedDbDocumentProvider } from '@core/cli/indexeddb-docstore-provider.ts'
import { ValidatorError } from '@core/std'
import { ApiError } from '@core/stdx'
import type { DocumentId } from '@core/stdx'
import { assert, assertEquals, assertRejects, assertStrictEquals } from '@std/assert'
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
      ATTACHMENTS_TEST_SERVER: 'uploads-server',
      UPLOADS_OTHER_INBOX: 'uploads-other-inbox',
      UPLOADS_OTHER_SERVER: 'uploads-other-server'
    })[key],
  fail: message => {
    throw new Error(message)
  }
}, [
  'LOCAL_DB_NAME',
  'DOCUMENT_INBOX_DB_NAME',
  'ATTACHMENTS_TEST_SERVER',
  'UPLOADS_OTHER_INBOX',
  'UPLOADS_OTHER_SERVER'
])
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
  value: {
    persist: () => {
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

Deno.test('drain preserves documents through interruptions and concurrent reads', async context => {
  const place = async (text: string): Promise<DocumentId> => {
    const staged = await Delivery.stage(new File([text], `${text}.txt`, { type: 'text/plain' }))
    const namespace = await Inbox.namespace.create('Consumer')
    const bucket = await Inbox.bucket.create(namespace.id, 'Destination')
    return (await Delivery.place(staged.id, bucket.id)).id
  }

  await context.step(
    'copy keeps ids, names, bytes and type; staging and empty containers stay',
    async () => {
      const staged = await Delivery.stage(new File(['staged'], 'staged.txt'))
      const attachment = await place('placed')
      const node = attachment
      const metadata = await Inbox.document.get(node)
      const ns = (await Inbox.namespace.list()).find(row => row.id.namespace === node.namespace)!
      const bucket = (await Inbox.bucket.list(ns.id)).find(row => row.id.bucket === node.bucket)!
      assertEquals(await Delivery.drain(), { drained: 1, remaining: 0 })
      assertEquals((await Server.namespace.get(ns.id)).name, ns.name)
      assertEquals((await Server.bucket.get(bucket.id)).name, bucket.name)
      assertEquals((await Server.document.get(node)).name, metadata.name)
      const body = await Server.document.read(node)
      assertEquals(await body.text(), 'placed')
      assertEquals(body.type, 'text/plain')
      await assertRejects(() => Inbox.document.get(node), ApiError)
      assertEquals((await Inbox.document.list(bucket.id)).length, 0)
      assertEquals((await Inbox.namespace.get(ns.id)).name, ns.name)
      assertEquals((await Delivery.get(staged.id)).count, 6)
      await assertRejects(
        () => Server.document.get(staged.id),
        ApiError
      )
      assertEquals(await Delivery.drain(), { drained: 0, remaining: 0 })
      assertEquals((await Delivery.get(attachment)).count, 6)
    }
  )

  await context.step('a failed copy retains its source and does not prevent other copies', async () => {
    const failed = await place('failed-copy')
    const good = await place('good-copy')
    const node = failed
    const create = Server.document.create
    Server.document.create = (parent, name, body, suppliedId) => {
      if (suppliedId === node.document) return Promise.reject(new ApiError('Injected copy failure', 503))
      return create(parent, name, body, suppliedId)
    }
    try {
      const error = await assertRejects(() => Delivery.drain(), AggregateError)
      assertEquals(error.errors.length, 1)
      assertEquals(await (await Inbox.document.read(node)).text(), 'failed-copy')
      assertEquals(
        await (await Server.document.read(good)).text(),
        'good-copy'
      )
      await assertRejects(() => Inbox.document.get(good), ApiError)
    } finally {
      Server.document.create = create
    }
    assertEquals(await Delivery.drain(), { drained: 1, remaining: 0 })
  })

  await context.step('unexpected errors propagate unchanged and stop the current pass', async () => {
    const first = await place('unexpected-first')
    const later = await place('unexpected-later')
    const failure = new TypeError('Injected programming error')
    const create = Server.document.create
    let attempts = 0
    Server.document.create = (): Promise<never> => {
      attempts++
      return Promise.reject(failure)
    }
    try {
      assertStrictEquals(await assertRejects(() => Delivery.drain(), TypeError), failure)
      assertEquals(attempts, 1)
      assertEquals(await (await Inbox.document.read(first)).text(), 'unexpected-first')
      assertEquals(await (await Inbox.document.read(later)).text(), 'unexpected-later')
      await assertRejects(() => Server.document.get(first), ApiError)
      await assertRejects(() => Server.document.get(later), ApiError)
    } finally {
      Server.document.create = create
    }
    assertEquals(await Delivery.drain(), { drained: 2, remaining: 0 })
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
      assertEquals(await Delivery.drain(), { drained: 1, remaining: 1 })
    } finally {
      Server.document.create = create
    }
    assertEquals(await Delivery.drain(), { drained: 1, remaining: 0 })
  })

  await context.step(
    'a cut-off after copying retries without duplicating or replacing the server copy',
    async () => {
      const attachment = await place('delete-interrupted')
      const node = attachment
      const remove = Inbox.document.delete
      Inbox.document.delete = () => Promise.reject(new ApiError('Injected delete failure', 503))
      try {
        await assertRejects(() => Delivery.drain(), AggregateError)
        assertEquals(await (await Inbox.document.read(node)).text(), 'delete-interrupted')
      } finally {
        Inbox.document.delete = remove
      }
      const before = await Server.document.get(node)
      assertEquals(await Delivery.drain(), { drained: 1, remaining: 0 })
      assertEquals(await Server.document.get(node), before)
      assertEquals(await (await Server.document.read(node)).text(), 'delete-interrupted')
    }
  )

  await context.step(
    'a document removed after listing counts only when the server holds it',
    async () => {
      const attachment = await place('another-drain')
      const node = attachment
      const read = Inbox.document.read
      Inbox.document.read = async target => {
        if (target.document === node.document) {
          await new Uploads({ ...Inbox, document: { ...Inbox.document, read } }, Server).drain()
        }
        return read(target)
      }
      try {
        assertEquals(await Delivery.drain(), { drained: 1, remaining: 0 })
      } finally {
        Inbox.document.read = read
      }
      assertEquals((await Delivery.get(attachment)).count, 13)
    }
  )

  await context.step('a missing source without a server copy is a failure', async () => {
    const attachment = await place('missing')
    const node = attachment
    const read = Inbox.document.read
    Inbox.document.read = async target => {
      if (target.document === node.document) await Inbox.document.delete(target)
      return read(target)
    }
    try {
      await assertRejects(() => Delivery.drain(), AggregateError)
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
        await Delivery.drain()
        return link(target)
      }
      try {
        const result = await Delivery.link(attachment)
        assertEquals(await (await fetch(result.url)).text(), 'read-race')
        URL.revokeObjectURL(result.url)
      } finally {
        Inbox.document.link = link
      }
      const next = await place('size-race')
      const get = Inbox.document.get
      Inbox.document.get = async target => {
        await Delivery.drain()
        return get(target)
      }
      try {
        assertEquals((await Delivery.get(next)).count, 9)
      } finally {
        Inbox.document.get = get
      }
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  )

  await context.step('staging 404s and other inbox errors never fall back', async () => {
    const staged = await Delivery.stage(new File(['private'], 'private.txt'))
    await Delivery.discard([staged.id])
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
      await assertRejects(() => Delivery.link(staged.id), ApiError)
      await assertRejects(() => Delivery.get(staged.id), ApiError)
      const attachment = await place('refused')
      Inbox.document.link = () => Promise.reject(new ApiError('Refused', 403))
      await assertRejects(() => Delivery.link(attachment), ApiError, 'Refused')
      assertEquals(fallbacks, 0)
    } finally {
      Server.document.link = link
      Server.document.get = get
      Inbox.document.link = inboxLink
    }
    await Delivery.drain()
  })
})

Deno.test('independent upload pairs preserve files and isolate identical logical lineages', async () => {
  const OtherInbox = new DocumentStore(new IndexedDbDocumentProvider('UPLOADS_OTHER_INBOX'), {
    linkLifetime: 5
  })
  const OtherServer = new DocumentStore(new IndexedDbDocumentProvider('UPLOADS_OTHER_SERVER'), {
    linkLifetime: 5
  })
  const Other = new Uploads(OtherInbox, OtherServer)
  const first = await Delivery.stage(
    new File(['first'], 'raw.bin', { type: 'application/octet-stream' })
  )
  const second = await Other.stage(new File(['second'], 'raw.bin', { type: 'application/custom' }))
  assert(Delivery.isStaged(first.id))
  assert(Other.isStaged(second.id))
  assertEquals(first.id.namespace, second.id.namespace)
  assertEquals((await OtherInbox.document.read(second.id)).type, 'application/custom')
  const namespace = await Inbox.namespace.create('Independent')
  const bucket = await Inbox.bucket.create(namespace.id, 'Destination')
  const otherNamespace = await OtherInbox.namespace.create('Independent', namespace.id.namespace)
  const otherBucket = await OtherInbox.bucket.create(otherNamespace.id, 'Destination', bucket.id.bucket)
  const placed = await Delivery.place(first.id, bucket.id)
  const otherPlaced = await Other.place(second.id, otherBucket.id)
  assert(!Delivery.isStaged(placed.id))
  await assertRejects(() => Delivery.discard([placed.id]), ValidatorError)
  assertEquals(await Delivery.place(first.id, bucket.id), placed)
  await Delivery.drain()
  await assertRejects(() => OtherServer.document.get(otherPlaced.id), ApiError)
  assertEquals(await (await OtherInbox.document.read(otherPlaced.id)).text(), 'second')
  assertEquals(await Other.drain(), { drained: 1, remaining: 0 })
  assertEquals(await (await Server.document.read(placed.id)).text(), 'first')
  assertEquals(await (await OtherServer.document.read(otherPlaced.id)).text(), 'second')
  await assertRejects(() => Server.document.get(otherPlaced.id), ApiError)
  assertEquals((await Delivery.get(first.id)).name, 'raw.bin')
  assertEquals((await Other.get(second.id)).count, 6)
})
