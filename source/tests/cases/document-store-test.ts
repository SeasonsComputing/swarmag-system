/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Document store tests                                                         ║
║ Verify the kernel contract against an in-memory provider.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { makeDocumentStore } from '@core/cli/make-docstore-client.ts'
import { id, ValidatorError, when } from '@core/std'
import type { Id } from '@core/std'
import { ApiError, DocumentAddresses } from '@core/stdx'
import type {
  ApiDocumentStoreContract,
  DocumentProviderContract,
  Lineage,
  LineageMetadata
} from '@core/stdx'
import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert'

Deno.test('document addresses round-trip names and ids at every depth', () => {
  const namespace = id()
  const bucket = id()
  const document = id()
  for (const address of ['manuals', `id:${namespace}/pumps`, `manuals/id:${bucket}/install.pdf`]) {
    assertEquals(DocumentAddresses.format(DocumentAddresses.parse(address)), address)
    assert(DocumentAddresses.validate(address))
  }
  const built = DocumentAddresses.build({ id: namespace }, { id: bucket }, { id: document })
  const reference = DocumentAddresses.format(built)
  assertEquals({ ...DocumentAddresses.id(reference) }, { namespace, bucket, document })
  assertEquals(DocumentAddresses.build('manuals', 'pumps', 'install.pdf'), [
    'manuals',
    'pumps',
    'install.pdf'
  ])
})

Deno.test('document grammar rejects malformed addresses and non-id references', () => {
  for (const address of ['', ' ', '/a', 'a/', 'a//b', 'a/b/c/d', 'id:bad', 'a/id:bad']) {
    assertEquals(DocumentAddresses.validate(address), false, address)
    assertThrows(() => DocumentAddresses.parse(address), ValidatorError)
  }
  assertThrows(() => DocumentAddresses.build('a', undefined, 'c'), ValidatorError)
  assertThrows(() => DocumentAddresses.build('id:reserved'), ValidatorError)
  assertThrows(() => DocumentAddresses.id('manuals/pumps/install.pdf'), ValidatorError)
  assertThrows(() => DocumentAddresses.id(`id:${id()}/id:${id()}`), ValidatorError)
})

Deno.test('kernel handles node lifecycle, counts, bytes, and rename', async () => {
  const { store } = memoryStore()
  const namespace = await store.namespace.create('manuals')
  const bucket = await store.bucket.create(namespace.id, 'pumps')
  const bytes = new Blob(['installation'], { type: 'application/pdf' })
  const document = await store.document.create(bucket.id, 'install.pdf', bytes)
  assertEquals(document.count, bytes.size)
  assertEquals((await store.namespace.get(namespace.id)).count, 1)
  assertEquals((await store.bucket.get(bucket.id)).count, 1)
  assertEquals((await store.document.read(document.id)).type, 'application/pdf')
  assertEquals(await (await store.document.read(document.id)).text(), 'installation')
  assertEquals(await store.bucket.list(namespace.id), [await store.bucket.get(bucket.id)])
  assertEquals(await store.document.find(bucket.id, 'install.pdf'), [document])
  const renamed = await store.document.update(document.id, 'setup.pdf')
  assertEquals(renamed.id, document.id)
  assertEquals(renamed.createdAt, document.createdAt)
  assertEquals(await store.document.find(bucket.id, 'install.pdf'), [])
  assertEquals((await store.document.resolve('manuals/pumps/setup.pdf')).id, document.id)
  await assertRejects(() => store.namespace.delete(namespace.id), ApiError, 'empty')
  await assertRejects(() => store.bucket.delete(bucket.id), ApiError, 'empty')
  assertEquals((await store.document.delete(document.id)).id, document.id.document)
  assertEquals((await store.bucket.get(bucket.id)).count, 0)
  await assertRejects(() => store.document.read(document.id), ApiError, 'not found')
  await store.bucket.delete(bucket.id)
  await store.namespace.delete(namespace.id)
  assertEquals(await store.namespace.list(), [])
})

Deno.test('document ids are idempotent per lineage and independent across parents', async () => {
  const { store } = memoryStore()
  const namespace = await store.namespace.create('manuals')
  const first = await store.bucket.create(namespace.id, 'first')
  const second = await store.bucket.create(namespace.id, 'second')
  const supplied = id()
  const document = await store.document.create(first.id, 'original', new Blob(['first']), supplied)
  assertEquals(
    await store.document.create(first.id, 'changed', new Blob(['different']), supplied),
    document
  )
  assertEquals(await (await store.document.read(document.id)).text(), 'first')
  const another = await store.document.create(second.id, 'other', new Blob(['second']), supplied)
  assertEquals(another.id.document, supplied)
  assertEquals(await (await store.document.read(another.id)).text(), 'second')
  assertEquals((await store.bucket.get(first.id)).count, 1)
})

Deno.test('resolution enforces depth, ambiguity, and parent membership', async () => {
  const { store } = memoryStore()
  const first = await store.namespace.create('first')
  const second = await store.namespace.create('second')
  const bucket = await store.bucket.create(first.id, 'bucket')
  await store.bucket.create(first.id, 'bucket')
  await assertRejects(() => store.bucket.resolve('first/bucket'), ApiError, 'ambiguous')
  await assertRejects(() => store.document.resolve('first/bucket'), ApiError, 'depth')
  await assertRejects(() => store.namespace.resolve('missing'), ApiError, 'not found')
  const exact = `id:${first.id.namespace}/id:${bucket.id.bucket}`
  assertEquals((await store.bucket.resolve(exact)).id, bucket.id)
  await assertRejects(
    () => store.bucket.resolve(`id:${second.id.namespace}/id:${bucket.id.bucket}`),
    ApiError,
    'not found'
  )
})

Deno.test('reference parsing performs no lookup and missing documents fail on use', async () => {
  const { store, Calls } = memoryStore()
  const reference = `id:${id()}/id:${id()}/id:${id()}`
  const identity = DocumentAddresses.id(reference)
  assertEquals(Calls.get, 0)
  await assertRejects(() => store.document.read(identity), ApiError, 'not found')
  await assertRejects(() => store.document.link(identity), ApiError, 'not found')
})

Deno.test('kernel validates names, addresses, and supplied ids before dispatch', async () => {
  const { store, Calls } = memoryStore()
  const namespace = await store.namespace.create('manuals')
  const bucket = await store.bucket.create(namespace.id, 'pumps')
  const before = Calls.create
  await assertRejects(() => store.namespace.create(' '), ApiError)
  await assertRejects(() => store.bucket.create(namespace.id, 'a/b'), ApiError)
  await assertRejects(() => store.document.create(bucket.id, 'file', new Blob(), 'bad'), ApiError)
  await assertRejects(() => store.bucket.update(bucket.id, 'id:reserved'), ApiError)
  await assertRejects(() => store.document.resolve('a//b'), ApiError)
  assertEquals(Calls.create, before)
})

Deno.test('link expiry is supplied by the kernel and is independent of authentication', async () => {
  const { store, Calls } = memoryStore(60_000)
  const namespace = await store.namespace.create('manuals')
  const bucket = await store.bucket.create(namespace.id, 'pumps')
  const document = await store.document.create(bucket.id, 'file', new Blob())
  const before = Date.now()
  const link = await store.document.link(document.id)
  assert(new Date(link.expiresAt).getTime() >= before + 60_000)
  assert(new Date(link.expiresAt).getTime() <= Date.now() + 60_000)
  assertEquals(Calls.expiry, link.expiresAt)
  assertEquals(link.url, 'memory:document')
})

Deno.test('identity types reject wrong levels and hand-built lineage', () => {
  const reference = DocumentAddresses.id(`id:${id()}/id:${id()}/id:${id()}`)
  const { store } = memoryStore()
  const verifyTypes = () => {
    // @ts-expect-error Document identity is not a bucket identity.
    store.bucket.get(reference)
    // @ts-expect-error Document identity is not a namespace identity.
    store.namespace.get(reference)
    // @ts-expect-error Plain lineage is not a nominal document identity.
    store.document.read({ namespace: id(), bucket: id(), document: id() })
  }
  assertEquals(typeof verifyTypes, 'function')
})

// ────────────────────────────────────────────────────────────────────────────
// IN-MEMORY PROVIDER
// ────────────────────────────────────────────────────────────────────────────

const memoryStore = (linkLifetime = 60_000) => {
  const nodes = new Map<string, LineageMetadata>()
  const bodies = new Map<string, Blob>()
  const Calls = { get: 0, create: 0, expiry: '' }
  const key = (node: Lineage): string => JSON.stringify([node.namespace, node.bucket, node.document])
  const parentOf = (node: Lineage): Lineage | null => {
    if (node.document !== undefined) return { namespace: node.namespace, bucket: node.bucket }
    if (node.bucket !== undefined) return { namespace: node.namespace }
    return null
  }
  const children = (parent: Lineage | null) =>
    [...nodes.values()].filter(row => JSON.stringify(parentOf(row.lineage)) === JSON.stringify(parent))
  const get = (node: Lineage): LineageMetadata => {
    Calls.get++
    const row = nodes.get(key(node))
    if (row === undefined) throw new ApiError('Node not found', 404)
    return {
      ...row,
      count: node.document === undefined ? children(node).length : bodies.get(key(node))!.size
    }
  }
  const Provider: DocumentProviderContract = {
    get: node => Promise.resolve(get(node)),
    find: (parent, name) =>
      Promise.resolve(children(parent).filter(row => row.name === name).map(row => get(row.lineage))),
    list: parent => Promise.resolve(children(parent).map(row => get(row.lineage))),
    create(node, name, body) {
      Calls.create++
      const parent = parentOf(node)
      if (parent !== null) get(parent)
      if (nodes.has(key(node))) return Promise.resolve(get(node))
      nodes.set(key(node), { lineage: node, name, createdAt: when(), count: 0 })
      if (body !== undefined) bodies.set(key(node), body)
      return Promise.resolve(get(node))
    },
    update(node, name) {
      const row = get(node)
      nodes.set(key(node), { ...row, name })
      return Promise.resolve(get(node))
    },
    delete(node) {
      get(node)
      if (children(node).length > 0) throw new ApiError('Container must be empty', 409)
      nodes.delete(key(node))
      bodies.delete(key(node))
      const ownId: Id = node.document ?? node.bucket ?? node.namespace
      return Promise.resolve({ id: ownId, deletedAt: when() })
    },
    read(node) {
      get(node)
      return Promise.resolve(bodies.get(key(node))!)
    },
    link(node, expiresAt) {
      get(node)
      Calls.expiry = expiresAt
      return Promise.resolve('memory:document')
    }
  }
  const store: ApiDocumentStoreContract = makeDocumentStore(Provider, linkLifetime)
  return { store, Calls }
}
