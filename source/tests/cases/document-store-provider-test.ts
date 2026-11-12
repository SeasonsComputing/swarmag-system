/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Document store provider tests                                               ║
║ Verify isolation, idempotency, bytes, links, and deletion in IndexedDB.     ║
╚═════════════════════════════════════════════════════════════════════════════╝

*/

import { Config } from '@core/cfg/config.ts'
import { DocumentStore } from '@core/cli/docstore-client.ts'
import { IndexedDbDocumentProvider } from '@core/cli/indexeddb-docstore-provider.ts'
import { IndexedDb } from '@core/db/indexeddb.ts'
import { id } from '@core/std'
import { ApiError } from '@core/stdx'
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
      LOCAL_DB_NAME: 'platform-test-app',
      FIRST_DB: 'platform-test-first',
      SECOND_DB: 'platform-test-second',
      REJECTED_DB: 'platform-test-rejected'
    })[key],
  fail: message => {
    throw new Error(message)
  }
}, ['LOCAL_DB_NAME', 'FIRST_DB', 'SECOND_DB', 'REJECTED_DB'])

IndexedDb.registerStore('Sentinel')
const First = new DocumentStore(new IndexedDbDocumentProvider('FIRST_DB'), { linkLifetime: 150 })
const Second = new DocumentStore(new IndexedDbDocumentProvider('SECOND_DB'), { linkLifetime: 150 })

Object.assign(globalThis, {
  indexedDB,
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
  IDBVersionChangeEvent
})

Deno.test('IndexedDB document providers isolate databases and preserve idempotent nodes', async () => {
  Object.defineProperty(navigator, 'storage', {
    configurable: true,
    value: { persist: () => Promise.resolve(true) }
  })
  const app = await IndexedDb.connection()
  const version = app.version
  await app.put('Sentinel', { id: 'sentinel', value: 'untouched' })
  const namespaceId = id()
  const bucketId = id()
  const documentId = id()
  const namespace = await First.namespace.create('original', namespaceId)
  equal(await First.namespace.create('changed', namespaceId), namespace)
  const bucket = await First.bucket.create(namespace.id, 'original', bucketId)
  equal(await First.bucket.create(namespace.id, 'changed', bucketId), bucket)
  const creates = await Promise.all([
    First.document.create(bucket.id, 'original', new Blob(['original']), documentId),
    First.document.create(bucket.id, 'changed', new Blob(['changed']), documentId)
  ])
  equal(creates[0], creates[1])
  equal(await (await First.document.read(creates[0].id)).text(), 'original')
  equal(await Second.namespace.list(), [])
  const otherNamespace = await Second.namespace.create('second', namespaceId)
  const otherBucket = await Second.bucket.create(otherNamespace.id, 'second', bucketId)
  const other = await Second.document.create(
    otherBucket.id,
    'second',
    new Blob(['second']),
    documentId
  )
  equal(await (await Second.document.read(other.id)).text(), 'second')
  equal(await (await First.document.read(creates[0].id)).text(), 'original')
  await rejects(() => First.namespace.delete(namespace.id), 409)
  await rejects(() => First.bucket.delete(bucket.id), 409)
  const document = creates[0].id
  const link = await First.document.link(document)
  equal(await (await fetch(link.url)).text(), 'original')
  await new Promise(resolve => setTimeout(resolve, 200))
  let expired = false
  try {
    await fetch(link.url)
  } catch {
    expired = true
  }
  equal(expired, true)
  const firstDb = await IndexedDb.connection('FIRST_DB')
  const secondDb = await IndexedDb.connection('SECOND_DB')
  equal([...firstDb.objectStoreNames], ['Content', 'Nodes'])
  equal([...secondDb.objectStoreNames], ['Content', 'Nodes'])
  for (const store of [First, Second]) {
    await store.document.delete(document)
    await rejects(() => store.document.read(document), 404)
    const bucket = await store.bucket.resolve(`id:${namespaceId}/id:${bucketId}`)
    equal(bucket.count, 0)
    await store.bucket.delete(bucket.id)
    const namespace = await store.namespace.resolve(`id:${namespaceId}`)
    await store.namespace.delete(namespace.id)
    equal(await store.namespace.list(), [])
  }
  equal(await firstDb.count('Content'), 0)
  equal(await secondDb.count('Content'), 0)
  equal([...app.objectStoreNames], ['Sentinel'])
  equal(await app.getAll('Sentinel'), [{ id: 'sentinel', value: 'untouched' }])
  equal(app.version, version)
  app.close()
  firstDb.close()
  secondDb.close()
})

Deno.test('persistence rejection is handled once without delaying or preventing local writes', async () => {
  const persistence = Promise.withResolvers<boolean>()
  let requests = 0
  Object.defineProperty(navigator, 'storage', {
    configurable: true,
    value: {
      persist: (): Promise<boolean> => {
        requests++
        return persistence.promise
      }
    }
  })
  const store = new DocumentStore(new IndexedDbDocumentProvider('REJECTED_DB'), { linkLifetime: 150 })
  // A write completes while the persistence request is still pending.
  const namespace = await store.namespace.create('Best effort')
  persistence.reject(new TypeError('Persistence request rejected'))
  // Allow an unhandled rejection to surface through the test runner before continuing.
  await new Promise<void>(resolve => setTimeout(resolve, 0))
  const bucket = await store.bucket.create(namespace.id, 'Documents')
  const document = await store.document.create(bucket.id, 'manual.txt', new Blob(['retained']))
  equal(await (await store.document.read(document.id)).text(), 'retained')
  equal((await store.document.list(bucket.id)).length, 1)
  equal(requests, 1)
  await store.document.delete(document.id)
  await store.bucket.delete(bucket.id)
  await store.namespace.delete(namespace.id)
  const db = await IndexedDb.connection('REJECTED_DB')
  db.close()
})

const equal = (actual: unknown, expected: unknown): void => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`)
  }
}

const rejects = async (operation: () => Promise<unknown>, status: number): Promise<void> => {
  try {
    await operation()
  } catch (error) {
    if (error instanceof ApiError && error.status === status) return
    throw error
  }
  throw new Error(`Expected rejection with status ${status}`)
}
