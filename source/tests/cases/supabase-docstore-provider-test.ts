/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Supabase document provider tests                                             ║
║ Verify isolated roots, marker lifecycle, pagination, and caller transport.   ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { Config } from '@core/cfg/config.ts'
import { DocumentStore } from '@core/cli/docstore-client.ts'
import { SupabaseDocumentProvider } from '@core/cli/supabase-docstore-provider.ts'
import { id } from '@core/std'
import { ApiError } from '@core/stdx'
import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert'
import { createClient } from '@supabase/client'

const Values = {
  SUPABASE_RDBMS_URL: 'http://storage.test',
  SUPABASE_PUBLIC_KEY: 'public',
  SUPABASE_CLIENT_MODE: 'edge',
  FIRST_ROOT: 'first-root',
  SECOND_ROOT: 'second-root',
  INVALID_ROOT: '../invalid'
}
Config.init({
  get: name => Values[name as keyof typeof Values],
  fail: message => {
    throw new Error(message)
  }
}, Object.keys(Values))

/** Transport rows model Storage objects, never logical docstore operations. */
type StoredObject = { name: string; body: Blob; createdAt: string }

Deno.test('provider resolves configured roots before storage operations', () => {
  const client = () => {
    throw new Error('Client must remain lazy')
  }
  assertThrows(() => new SupabaseDocumentProvider(client, 'INVALID_ROOT'), ApiError)
  assertThrows(() => new SupabaseDocumentProvider(client, 'MISSING_ROOT'))
  new SupabaseDocumentProvider(client, 'FIRST_ROOT')
})

Deno.test('Storage roots isolate lineage and preserve marker and document lifecycle', async () => {
  const rows = new Map<string, StoredObject>()
  const createdAt = '2026-11-10T00:00:00.000Z'
  let denial = 0
  let uploadDenial = 0
  let listPages = 0
  let signedSeconds = 0
  const originalFetch = globalThis.fetch
  const missing = () => Response.json({ message: 'not found', statusCode: '404' }, { status: 404 })
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init)
    const path = decodeURIComponent(new URL(request.url).pathname.replace('/storage/v1/', ''))
    if (denial) {
      return Response.json({ message: 'refused', statusCode: String(denial) }, { status: 400 })
    }
    assert(!path.startsWith('bucket'), 'Provider must never discover or provision native buckets')
    if (path.startsWith('object/info/')) {
      const row = rows.get(path.slice('object/info/'.length))
      return row
        ? Response.json({
          size: row.body.size,
          created_at: row.createdAt,
          metadata: { name: row.name }
        })
        : missing()
    }
    if (path.startsWith('object/list/')) {
      const root = path.slice('object/list/'.length)
      const query = await request.json()
      const prefix = `${root}/${query.prefix ? `${query.prefix}/` : ''}`
      const names = [
        ...new Set(
          [...rows.keys()].filter(key => key.startsWith(prefix))
            .map(key => key.slice(prefix.length).split('/')[0])
        )
      ].sort()
      listPages++
      return Response.json(names.slice(query.offset, query.offset + query.limit).map(name => ({ name })))
    }
    if (path === 'object/copy') {
      assertEquals(request.headers.get('authorization'), 'Bearer caller-token')
      assertEquals(request.headers.get('x-upsert'), 'true')
      const payload = await request.json()
      assertEquals(payload.sourceKey, payload.destinationKey)
      assertEquals(payload.copyMetadata, false)
      const row = rows.get(`${payload.bucketId}/${payload.sourceKey}`)!
      const metadata = JSON.parse(new TextDecoder().decode(Uint8Array.from(
        atob(request.headers.get('x-metadata')!),
        c => c.charCodeAt(0)
      )))
      row.name = metadata.name
      return Response.json({ Key: payload.sourceKey })
    }
    if (path.startsWith('object/sign/')) {
      const key = path.slice('object/sign/'.length)
      if (!rows.has(key)) return missing()
      signedSeconds = (await request.json()).expiresIn
      return Response.json({ signedURL: `/object/sign/${key}?token=caller-signed` })
    }
    if (path.startsWith('object/')) {
      const key = path.slice('object/'.length)
      if (request.method === 'POST') {
        if (uploadDenial) {
          return Response.json({ message: 'upload refused', statusCode: String(uploadDenial) }, {
            status: 400
          })
        }
        if (rows.has(key)) {
          return Response.json({ message: 'duplicate', statusCode: '409' }, { status: 400 })
        }
        const form = init?.body instanceof FormData ? init.body : await request.formData()
        const body = [...form.values()].find((value): value is File => value instanceof File)
        assert(body, `No upload bytes in multipart fields: ${[...form.keys()]}`)
        const metadata = JSON.parse(String(form.get('metadata')))
        rows.set(key, { name: metadata.name, body, createdAt })
        return Response.json({ Key: key })
      }
      if (request.method === 'DELETE') {
        for (const prefix of (await request.json()).prefixes) rows.delete(`${key}/${prefix}`)
        return Response.json([])
      }
      if (request.method === 'GET') {
        const row = rows.get(key)
        return row ? new Response(row.body, { headers: { 'content-type': row.body.type } }) : missing()
      }
    }
    throw new Error(`Unexpected request: ${request.method} ${path}`)
  }
  const client = createClient(Values.SUPABASE_RDBMS_URL, Values.SUPABASE_PUBLIC_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })
  client.auth.getSession = () =>
    Promise.resolve({
      data: {
        session: {
          access_token: 'caller-token',
          refresh_token: 'refresh',
          token_type: 'bearer',
          expires_in: 3600,
          user: {
            id: id(),
            aud: 'authenticated',
            app_metadata: {},
            user_metadata: {},
            created_at: createdAt
          }
        }
      },
      error: null
    })
  let clientCalls = 0
  const accessor = () => {
    clientCalls++
    return client
  }
  const first = new DocumentStore(new SupabaseDocumentProvider(accessor, 'FIRST_ROOT'), {
    linkLifetime: 5000
  })
  const second = new DocumentStore(new SupabaseDocumentProvider(accessor, 'SECOND_ROOT'), {
    linkLifetime: 5000
  })
  assertEquals(clientCalls, 0)
  try {
    const namespace = await first.namespace.create('Shared')
    const otherNamespace = await second.namespace.create('Other', namespace.id.namespace)
    assertEquals((await first.namespace.list()).map(node => node.name), ['Shared'])
    assertEquals((await second.namespace.list()).map(node => node.name), ['Other'])
    assertEquals((await first.namespace.resolve('Shared')).id, namespace.id)
    const owner = await first.bucket.create(namespace.id, 'Owner')
    const otherOwner = await second.bucket.create(otherNamespace.id, 'Owner', owner.id.bucket)
    const document = await first.document.create(
      owner.id,
      'original',
      new Blob(['abc'], {
        type: 'text/plain'
      })
    )
    const otherDocument = await second.document.create(
      otherOwner.id,
      'independent',
      new Blob(['def']),
      document.id.document
    )
    assertEquals(document.id, otherDocument.id)
    assertEquals(await (await first.document.read(document.id)).text(), 'abc')
    assertEquals(await (await second.document.read(document.id)).text(), 'def')
    assertEquals(
      await first.document.create(owner.id, 'changed', new Blob(['wrong']), document.id.document),
      document
    )
    const concurrentId = id()
    const concurrent = await Promise.all([
      first.document.create(owner.id, 'winner', new Blob(['abc']), concurrentId),
      first.document.create(owner.id, 'loser', new Blob(['def']), concurrentId)
    ])
    assertEquals(concurrent[0], concurrent[1])
    const renamed = await first.document.update(document.id, '日本語')
    assertEquals(renamed.createdAt, document.createdAt)
    assertEquals(renamed.count, 3)
    assertEquals((await first.bucket.update(owner.id, 'Renamed owner')).createdAt, owner.createdAt)
    assertEquals((await first.namespace.update(namespace.id, 'Renamed')).createdAt, namespace.createdAt)
    assertEquals((await first.document.resolve('Renamed/Renamed owner/日本語')).id, document.id)
    await first.document.link(document.id)
    assert(signedSeconds > 0 && signedSeconds <= 5)
    const missingNamespace = { namespace: id() }
    await assertRejects(() =>
      new SupabaseDocumentProvider(accessor, 'FIRST_ROOT').create(
        { ...missingNamespace, bucket: id() },
        'Orphan'
      ), ApiError)
    for (let index = 0; index < 101; index++) {
      rows.set(`first-root/${namespace.id.namespace}/${owner.id.bucket}/${id()}`, {
        name: 'duplicate',
        body: new Blob(['abc']),
        createdAt
      })
    }
    for (let index = 0; index < 101; index++) {
      rows.set(`first-root/${id()}/.namespace`, {
        name: 'Repeated namespace',
        body: new Blob([]),
        createdAt
      })
    }
    assertEquals((await first.namespace.list()).length, 102)
    await assertRejects(() => first.namespace.resolve('Repeated namespace'), ApiError)
    const pagesBefore = listPages
    assertEquals((await first.document.list(owner.id)).length, 103)
    assert(listPages - pagesBefore >= 2)
    assertEquals((await first.bucket.get(owner.id)).count, 103)
    assertEquals((await first.namespace.get(namespace.id)).count, 1)
    await assertRejects(() => first.document.resolve('Renamed/Renamed owner/duplicate'), ApiError)
    await assertRejects(() => first.bucket.delete(owner.id), ApiError)
    await assertRejects(() => first.namespace.delete(namespace.id), ApiError)
    const empty = await first.namespace.create('Empty')
    const emptyBucket = await first.bucket.create(empty.id, 'Empty')
    const strayKey = `first-root/${empty.id.namespace}/${emptyBucket.id.bucket}/unexpected`
    rows.set(strayKey, { name: 'Stray', body: new Blob([]), createdAt })
    await assertRejects(() => first.bucket.delete(emptyBucket.id), ApiError)
    rows.delete(strayKey)
    await first.bucket.delete(emptyBucket.id)
    await first.namespace.delete(empty.id)
    await assertRejects(() => first.namespace.get(empty.id), ApiError)
    for (const status of [403, 404, 409, 413, 415, 500]) {
      denial = status
      const error = await assertRejects(() => first.document.get(document.id), ApiError)
      assertEquals(error.status, status)
    }
    denial = 0
    for (const status of [413, 415]) {
      uploadDenial = status
      const error = await assertRejects(
        () => first.document.create(owner.id, 'refused', new Blob(['abc'])),
        ApiError
      )
      assertEquals(error.status, status)
    }
    uploadDenial = 0
    await first.document.delete(document.id)
    assertEquals(await (await second.document.read(otherDocument.id)).text(), 'def')
  } finally {
    globalThis.fetch = originalFetch
  }
})
