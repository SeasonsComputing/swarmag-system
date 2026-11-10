/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Supabase document provider tests                                             ║
║ Exercise paginated counts, info metadata, immutable creates, and refusals.   ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { Config } from '@core/cfg/config.ts'
import { DocumentStore } from '@core/cli/docstore-client.ts'
import { SupabaseDocumentProvider } from '@core/cli/supabase-docstore-provider.ts'
import { id, toId } from '@core/std'
import { ApiError } from '@core/stdx'
import { assertEquals, assertRejects } from '@std/assert'
import { createClient } from '@supabase/client'

const Values = {
  SUPABASE_RDBMS_URL: 'http://storage.test',
  SUPABASE_PUBLIC_KEY: 'public',
  SUPABASE_CLIENT_MODE: 'edge'
}
Config.init({
  get: name => Values[name as keyof typeof Values],
  fail: message => {
    throw new Error(message)
  }
}, Object.keys(Values))

Deno.test('Storage provider pages lists, preserves immutable creates, and renames through caller transport', async () => {
  const namespace = toId('019a6000-0000-7000-8000-000000000003')
  const bucket = id()
  const document = id()
  const createdAt = '2026-11-10T00:00:00.000Z'
  const rows = new Map<string, { name: string; size: number }>()
  rows.set(`${bucket}/.bucket`, { name: 'owner', size: 0 })
  for (let index = 0; index < 101; index++) {
    rows.set(`${bucket}/${id()}`, { name: `file-${index}`, size: 3 })
  }
  rows.set(`${bucket}/${document}`, { name: 'original', size: 3 })
  let renameHeader = ''
  let denial = 0
  let uploadDenial = 0
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init)
    const path = new URL(request.url).pathname.replace('/storage/v1/', '')
    if (denial) {
      return Response.json({
        message: denial === 413 ? 'too large' : 'mime type refused',
        statusCode: String(denial)
      }, { status: 400 })
    }
    if (path === `bucket/${namespace}`) {
      return Response.json({ id: namespace, name: 'Customers', created_at: createdAt })
    }
    if (path.startsWith(`object/info/${namespace}/`)) {
      const row = rows.get(path.slice(`object/info/${namespace}/`.length))
      return row
        ? Response.json({ size: row.size, created_at: createdAt, metadata: { name: row.name } })
        : Response.json({ message: 'not found', statusCode: '404' }, { status: 404 })
    }
    if (path === `object/list/${namespace}`) {
      const query = await request.json()
      const names = query.prefix === '' ? [bucket] : [...rows.keys()].map(key => key.split('/')[1])
      return Response.json(
        names.sort().slice(query.offset, query.offset + query.limit).map(name => ({ name }))
      )
    }
    if (path.startsWith(`object/${namespace}/`) && request.method === 'POST') {
      const key = path.slice(`object/${namespace}/`.length)
      if (uploadDenial) {
        return Response.json({
          message: uploadDenial === 413 ? 'too large' : 'mime type refused',
          statusCode: String(uploadDenial)
        }, { status: 400 })
      }
      const raw = await request.clone().text()
      const form = await request.formData()
      if (rows.has(key)) {
        return Response.json({ message: 'already exists', statusCode: '409' }, { status: 400 })
      }
      const metadata = JSON.parse(String(form.get('metadata')))
      assertEquals(raw.includes('abc') || raw.includes('def'), true)
      rows.set(key, { name: metadata.name, size: 3 })
      return Response.json({ Key: key })
    }
    if (path === 'object/copy') {
      assertEquals(request.headers.get('authorization'), 'Bearer caller-token')
      assertEquals(request.headers.get('x-upsert'), 'true')
      renameHeader = request.headers.get('x-metadata')!
      const payload = await request.json()
      assertEquals(payload.sourceKey, payload.destinationKey)
      assertEquals(payload.copyMetadata, false)
      const row = rows.get(payload.sourceKey)!
      row.name = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(renameHeader), c =>
        c.charCodeAt(0)))).name
      return Response.json({ Key: payload.sourceKey })
    }
    if (path === `object/${namespace}/${bucket}/${document}` && request.method === 'GET') {
      return new Response('abc', { headers: { 'content-type': 'text/plain' } })
    }
    throw new Error(`Unexpected storage request: ${request.method} ${path}`)
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
            id: namespace,
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
  const store = new DocumentStore(
    new SupabaseDocumentProvider(() => {
      clientCalls++
      return client
    }),
    { linkLifetime: 5000 }
  )
  assertEquals(clientCalls, 0)
  try {
    const ns = await store.namespace.create('ignored', namespace)
    assertEquals(clientCalls > 0, true)
    assertEquals(ns.name, 'Customers')
    assertEquals(ns.count, 1)
    const owner = await store.bucket.create(ns.id, 'ignored', bucket)
    assertEquals(owner.count, 102)
    const existing = await store.document.create(owner.id, 'changed', new Blob(['different']), document)
    assertEquals(existing.name, 'original')
    assertEquals((await store.document.list(owner.id)).length, 102)
    const concurrentId = id()
    const creates = await Promise.all([
      store.document.create(owner.id, 'first', new Blob(['abc'], { type: 'text/plain' }), concurrentId),
      store.document.create(owner.id, 'second', new Blob(['def'], { type: 'text/plain' }), concurrentId)
    ])
    assertEquals(creates[0], creates[1])
    assertEquals(creates[0].name, 'first')
    const renamed = await store.document.update(existing.id, '日本語')
    assertEquals(renamed.name, '日本語')
    assertEquals(renamed.createdAt, existing.createdAt)
    assertEquals(await (await store.document.read(existing.id)).text(), 'abc')
    await assertRejects(() => store.namespace.update(ns.id, 'no'), ApiError)
    const namespaceDelete = await assertRejects(() => store.namespace.delete(ns.id), ApiError)
    assertEquals(namespaceDelete.status, 405)
    await assertRejects(() => store.bucket.delete(owner.id), ApiError)
    for (const status of [403, 404, 409, 413, 415, 500]) {
      denial = status
      try {
        await store.document.get(existing.id)
        throw new Error('Expected refusal')
      } catch (error) {
        assertEquals(error instanceof ApiError && error.status, status)
      }
    }
    denial = 0
    for (const status of [413, 415]) {
      uploadDenial = status
      try {
        await store.document.create(owner.id, 'refused', new Blob(['abc']), id())
        throw new Error('Expected upload refusal')
      } catch (error) {
        assertEquals(error instanceof ApiError && error.status, status)
      }
    }
  } finally {
    globalThis.fetch = originalFetch
  }
})
