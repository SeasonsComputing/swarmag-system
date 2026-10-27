/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Asset API integration tests                                                  ║
║ Exercise composed clients and owned scopes through an in-memory transport.   ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { Config } from '@core/cfg/config.ts'
import { Supabase } from '@core/db/supabase.ts'
import { isId } from '@core/std'
import type { Dictionary } from '@core/std'
import { AssetTypeAdapter } from '@domain/adapters/asset-adapter.ts'
import { scopes } from '@front/api/scopes.ts'
import { assetTypeDraft, createAssetTypeState } from '@front/app-admin/asset-types/asset-type-state.ts'
import { assetDraft, createAssetState } from '@front/app-admin/assets/asset-state.ts'
import { assert, assertEquals, assertRejects } from '@std/assert'
import { createClient } from '@supabase/client'

Config.init({
  get: key => key === 'LOCAL_DB_NAME' ? 'asset-api-test' : undefined,
  fail: message => {
    throw new Error(message)
  }
}, ['LOCAL_DB_NAME'])
const { api } = await import('@front/api/api.ts')

Deno.test('Asset clients exercise CRUD and soft deletion', async () => {
  await withTransport(async () => {
    const typeState = createAssetTypeState()
    typeState.setLabel('  Aircraft  ')
    const type = await api.AssetTypes.create(
      scopes.AssetTypes.detail.toCreate(assetTypeDraft(typeState))
    )
    assertEquals(type.label, 'Aircraft')
    assertEquals((await api.AssetTypes.get(type.id)).active, true)
    assertEquals((await api.AssetTypes.list()).data.length, 1)
    typeState.setActive(false)
    const inactive = await api.AssetTypes.update(
      scopes.AssetTypes.detail.adapter,
      scopes.AssetTypes.detail.toUpdate(type.id, assetTypeDraft(typeState))
    )
    assertEquals(inactive.active, false)
    assertEquals(inactive.deletedAt, undefined)

    const assetState = createAssetState()
    assetState.setType(type.id)
    assetState.setLabel('  Aircraft one  ')
    assetState.setDescription('Initial description')
    const asset = await api.Assets.create(scopes.Assets.detail.toCreate(assetDraft(assetState)))
    assertEquals(asset.type, type.id)
    assetState.setDescription(' ')
    assetState.setSerialNumber('  Serial one  ')
    const edited = await api.Assets.update(
      scopes.Assets.detail.adapter,
      scopes.Assets.detail.toUpdate(asset.id, assetDraft(assetState))
    )
    assertEquals(edited.description, undefined)
    assertEquals(edited.serialNumber, 'Serial one')
    assertEquals((await api.Assets.get(asset.id)).serialNumber, 'Serial one')
    assertEquals((await api.Assets.list()).data.length, 1)

    for (const [client, record] of [[api.AssetTypes, type], [api.Assets, asset]] as const) {
      const removed = await client.delete(record.id)
      assertEquals(removed.id, record.id)
      assert(removed.deletedAt)
      assertEquals((await client.get(record.id)).deletedAt, removed.deletedAt)
      assertEquals((await client.list()).data, [])
      await assertRejects(() => client.delete(record.id))
    }
  })
})

Deno.test('Stored type lookup resolves inactive and deleted references', async () => {
  await withTransport(async () => {
    const created = await api.AssetTypes.create({ label: 'Stored type', active: false })
    assertEquals((await api.AssetTypes.get(created.id)).active, false)
    await api.AssetTypes.delete(created.id)
    assertEquals((await api.AssetTypes.list()).data, [])
    const stored = await api.AssetTypes.get(created.id)
    assertEquals(stored.label, 'Stored type')
    assert(stored.deletedAt)
    assertEquals(AssetTypeAdapter.toDomain(AssetTypeAdapter.fromDomain(stored)), stored)
  })
})

Deno.test('Asset clients enforce validators before dispatch', async () => {
  await withTransport(async tables => {
    await assertRejects(() => api.AssetTypes.create({ label: '', active: true }))
    await assertRejects(() =>
      api.Assets.create({ type: '', label: 'Asset', status: 'active', notes: [] })
    )
    assertEquals(tables, { asset_types: [], assets: [] })
  })
})

// Isolate only transport; exercise the production SDK, adapters, scopes, and validators.
const withTransport = async (
  run: (tables: Dictionary<Dictionary[]>) => Promise<void>
): Promise<void> => {
  const tables: Dictionary<Dictionary[]> = { asset_types: [], assets: [] }
  const original = Supabase.client
  const client = createClient('http://asset-api.invalid', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input, init) => {
        const request = new Request(input, init)
        const url = new URL(request.url)
        const table = url.pathname.slice('/rest/v1/'.length)
        assert(table in tables)
        const rows = tables[table]
        const target = url.searchParams.get('id')?.slice('eq.'.length)
        if (request.method === 'POST') {
          const row = await request.json() as Dictionary
          assert(isId(row.id))
          rows.push(row)
          return Response.json(row)
        }
        let visible = rows.filter(row => target === undefined || row.id === target)
        if (url.searchParams.get('deleted_at') === 'is.null') {
          visible = visible.filter(row => !row.deleted_at)
        }
        if (request.method === 'PATCH') {
          assertEquals(url.searchParams.get('deleted_at'), 'is.null')
          if (visible.length === 0) {
            return Response.json({ code: 'PGRST116', message: 'No live record' }, { status: 406 })
          }
          const patch = await request.json() as Dictionary
          Object.assign(visible[0], patch)
          return Response.json(visible[0])
        }
        assertEquals(request.method, 'GET')
        if (target !== undefined) {
          assertEquals(url.searchParams.get('deleted_at'), null)
          return Response.json(visible[0])
        }
        assertEquals(url.searchParams.get('deleted_at'), 'is.null')
        return Response.json(visible)
      }
    }
  })
  Supabase.client = () => client
  try {
    await run(tables)
  } finally {
    Supabase.client = original
  }
}
