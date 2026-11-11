/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Stage document store contract tests                                          ║
║ Exercise provisioned namespaces through a caller session and clean up.       ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { Config } from '@core/cfg/config.ts'
import { DenoProvider } from '@core/cfg/deno-provider.ts'
import { DocumentStore } from '@core/cli/docstore-client.ts'
import { SupabaseDocumentProvider } from '@core/cli/supabase-docstore-provider.ts'
import { Supabase } from '@core/db/supabase.ts'
import { id, toId } from '@core/std'
import { ApiError } from '@core/stdx'
import { Attachments } from '@front/api/attachments.ts'
import { assertEquals, assertRejects } from '@std/assert'

// Explicit opt-in: these calls write stage objects and run only after CA provisioning/reset.
Deno.test({
  name: 'stage document store contract: immutable creates, metadata, links, cleanup, signed-out refusal',
  ignore: new DenoProvider().get('RUN_STAGE_DOCSTORE_TESTS') !== '1',
  async fn() {
    await import('@tests/config/stage-config.ts')
    const { StageSession } = await import('@tests/fixtures/stage-session.ts')
    const store = new DocumentStore(
      new SupabaseDocumentProvider(Supabase.client, 'ATTACHMENTS_SERVER_ROOT'),
      {
        linkLifetime: 5000
      }
    )
    await StageSession.run(async () => {
      await assertRejects(() =>
        store.namespace.create(
          'Staging',
          toId('019a6000-0000-7000-8000-000000000001')
        ), ApiError)
      for (const placement of Attachments.namespaces) {
        const ns = await store.namespace.create(placement.name, placement.id)
        assertEquals(ns.name, placement.name)
        assertEquals((await store.namespace.update(ns.id, placement.name)).createdAt, ns.createdAt)
        const bucket = await store.bucket.create(ns.id, 'contract-owner', id())
        try {
          const documentId = id()
          const body = new Blob(['contract bytes'], { type: 'text/plain' })
          const document = await store.document.create(bucket.id, 'original', body, documentId)
          try {
            assertEquals(
              await store.document.create(bucket.id, 'changed', new Blob(['wrong']), documentId),
              document
            )
            assertEquals((await store.bucket.get(bucket.id)).count, 1)
            assertEquals((await store.document.list(bucket.id)).length, 1)
            await assertRejects(() => store.bucket.delete(bucket.id), ApiError)
            const renamed = await store.document.update(document.id, 'renamed')
            assertEquals(renamed.createdAt, document.createdAt)
            assertEquals(renamed.count, body.size)
            assertEquals((await store.document.find(bucket.id, 'renamed')).length, 1)
            const owner = await store.bucket.update(bucket.id, 'renamed-owner')
            assertEquals(owner.createdAt, bucket.createdAt)
            assertEquals(await (await store.document.read(document.id)).text(), 'contract bytes')
            const link = await store.document.link(document.id)
            const response = await fetch(link.url)
            assertEquals(response.ok, true)
            assertEquals(response.headers.get('content-type')?.split(';')[0], 'text/plain')
            console.log(
              `STORAGE_NOSNIFF=${
                response.headers.get('x-content-type-options') ?? 'absent (CA accepted gap)'
              }`
            )
            assertEquals(await response.text(), 'contract bytes')
          } finally {
            await store.document.delete(document.id)
          }
          assertEquals((await store.bucket.get(bucket.id)).count, 0)
        } finally {
          await store.bucket.delete(bucket.id)
        }
      }
    })
    // StageSession has signed out the public client. Neither bytes nor markers may be uploaded.
    const placement = Attachments.namespaces[0]
    const denied = await Supabase.client().storage.from(Config.get('ATTACHMENTS_SERVER_ROOT')).upload(
      `${placement.id}/${id()}/.bucket`,
      new Blob([], { type: 'text/plain' }),
      { metadata: { name: 'denied' } }
    )
    assertEquals(denied.error !== null, true)
    await assertRejects(() => store.namespace.create(placement.name, placement.id), ApiError)
  }
})
