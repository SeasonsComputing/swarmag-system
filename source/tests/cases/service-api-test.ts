/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Service API and editor data tests                                            ║
║ Verify scoped CRUD, membership loading, reference choices, and save retries. ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { Config } from '@core/cfg/config.ts'
import { Supabase } from '@core/db/supabase.ts'
import { id, instantiable } from '@core/std'
import type { Dictionary, Id } from '@core/std'
import type { AssetType } from '@domain/abstractions/asset.ts'
import { createServiceState, serviceDraft } from '@front/app-admin/services/service-state.ts'
import { assert, assertEquals, assertRejects } from '@std/assert'
import { createClient } from '@supabase/client'

Config.init({
  get: key => key === 'LOCAL_DB_NAME' ? 'service-api-test' : undefined,
  fail: message => {
    throw new Error(message)
  }
}, ['LOCAL_DB_NAME'])
const { api } = await import('@front/api/api.ts')
const {
  createServiceSave,
  loadServices,
  resolveServiceAssetTypes,
  serviceAssetTypeOptions,
  serviceAssetTypeLabels
} = await import('@front/app-admin/services/service-data.ts')

Deno.test('Service CRUD preserves facets, clears description, and soft deletes', async () => {
  await withTransport(async test => {
    const state = createServiceState()
    state.setName('  Aerial work  ')
    state.setSku('  AIR-1  ')
    state.setCategory('aerial-drone-services')
    state.setDescription('  Description  ')
    const saved = await createServiceSave().create(serviceDraft(state))
    assertEquals(saved.name, 'Aerial work')
    assertEquals(saved.sku, 'AIR-1')
    assertEquals(saved.description, 'Description')
    assertEquals(saved.facets, [])
    test.tables.services[0].facets = ['work:aerial']
    state.setDescription(' ')
    const updated = await createServiceSave().update(saved, serviceDraft(state))
    assertEquals(updated.description, undefined)
    assertEquals(updated.facets, ['work:aerial'])
    assertEquals((await api.Services.list()).data.length, 1)
    const removed = await api.Services.delete(saved.id)
    assert(removed.deletedAt)
    assertEquals((await api.Services.get(saved.id)).deletedAt, removed.deletedAt)
    assertEquals((await api.Services.list()).data, [])
    await assertRejects(() => api.Services.delete(saved.id))
    await assertRejects(() => createServiceSave().update(saved, serviceDraft(state)))
  })
})

Deno.test('Service loads membership before opening and rejects read failures', async () => {
  await withTransport(async test => {
    const state = createServiceState()
    state.setName('Ground work')
    state.setSku('GROUND-1')
    state.setCategory('ground-machinery-services')
    state.setRequiredAssetTypes([id(), id()])
    const saved = await createServiceSave().create(serviceDraft(state))
    const emptyState = createServiceState()
    emptyState.setName('No requirements')
    emptyState.setSku('EMPTY-1')
    emptyState.setCategory('aerial-drone-services')
    const empty = await createServiceSave().create(serviceDraft(emptyState))
    const before = test.requests.length
    const records = await loadServices()
    const reads = test.requests.slice(before)
    assertEquals(reads.length, 2)
    assertEquals(
      reads.filter(request => new URL(request.url).pathname.endsWith('/service_required_asset_types'))
        .length,
      1
    )
    assertEquals(records.find(record => record.id === empty.id)?.requiredAssetTypes, [])
    assertEquals(records.length, 2)
    assertEquals(records[0].id, saved.id)
    const opened = serviceDraft(createServiceState(records[0]))
    assertEquals(opened.requiredAssetTypes, serviceDraft(state).requiredAssetTypes)
    test.fail = 'GET service_required_asset_types'
    await assertRejects(loadServices, Error, 'Injected failure')
  })
})

Deno.test('Service retry reuses its owner and converges after partial replacement', async () => {
  await withTransport(async test => {
    const state = createServiceState()
    state.setName('First attempt')
    state.setSku('RETRY-1')
    state.setCategory('ground-machinery-services')
    const first = id()
    const next = id()
    state.setRequiredAssetTypes([first])
    const save = createServiceSave()
    test.fail = 'POST service_required_asset_types'
    await assertRejects(() => save.create(serviceDraft(state)), Error, 'Injected failure')
    assertEquals(test.tables.services.length, 1)
    const owner = test.tables.services[0].id
    state.setName('Edited before retry')
    const saved = await save.create(serviceDraft(state))
    assertEquals(saved.id, owner)
    assertEquals(saved.name, 'Edited before retry')
    assertEquals(test.tables.services.length, 1)
    assertEquals(await api.ServiceRequiredAssetTypes.partners(saved.id), [first])
    state.setRequiredAssetTypes([next])
    test.fail = 'POST service_required_asset_types'
    await assertRejects(() => save.update(saved, serviceDraft(state)))
    assertEquals(await api.ServiceRequiredAssetTypes.partners(saved.id), [])
    await save.update(saved, serviceDraft(state))
    assertEquals(await api.ServiceRequiredAssetTypes.partners(saved.id), [next])
    state.setRequiredAssetTypes([])
    await save.update(saved, serviceDraft(state))
    assertEquals(await api.ServiceRequiredAssetTypes.partners(saved.id), [])
    const fresh = await createServiceSave().create(serviceDraft(state))
    assert(fresh.id !== saved.id)
    assertEquals(test.tables.services.length, 2)
  })
})

Deno.test('Service validation rejects invalid fields and pairs before writes', async () => {
  await withTransport(async test => {
    const state = createServiceState()
    state.setCategory('aerial-drone-services')
    await assertRejects(() => createServiceSave().create(serviceDraft(state)))
    assertEquals(test.tables.services, [])
    await assertRejects(() => api.ServiceRequiredAssetTypes.replace(id(), ['invalid']))
    assertEquals(test.tables.service_required_asset_types, [])
    assertEquals(test.requests.filter(request => request.method !== 'GET'), [])
  })
})

Deno.test('Service saves require an explicitly chosen category before any persistence', async () => {
  await withTransport(async test => {
    const state = createServiceState()
    state.setName('Choose a category')
    state.setSku('CATEGORY-1')
    const save = createServiceSave()
    await assertRejects(() => save.create(serviceDraft(state)), Error, 'Select a category.')
    assertEquals(test.requests, [])
    state.setCategory('ground-machinery-services')
    const saved = await save.create(serviceDraft(state))
    assertEquals(saved.category, 'ground-machinery-services')
    state.setCategory(undefined)
    const before = test.requests.length
    await assertRejects(() => save.update(saved, serviceDraft(state)), Error, 'Select a category.')
    assertEquals(test.requests.length, before)
  })
})

Deno.test('Service choices retain inactive and deleted partners in label order', async () => {
  await withTransport(async test => {
    const active = assetType('Zulu', true)
    const inactive = assetType('Alpha', false)
    const deleted = { ...assetType('Bravo', true), deletedAt: active.createdAt }
    const excluded = assetType('Unrelated inactive', false)
    const catalog = [active, inactive, excluded]
    test.tables.asset_types.push({
      id: deleted.id,
      label: deleted.label,
      active: deleted.active,
      created_at: deleted.createdAt,
      updated_at: deleted.updatedAt,
      deleted_at: deleted.deletedAt
    })
    const storedIds = [inactive.id, deleted.id]
    const stored = await resolveServiceAssetTypes(storedIds, catalog)
    assertEquals(stored.map(type => type.id), storedIds)
    const options = serviceAssetTypeOptions(catalog, stored)
    assertEquals(options, [
      { value: inactive.id, label: 'Alpha (inactive)' },
      { value: deleted.id, label: 'Bravo (deleted)' },
      { value: active.id, label: 'Zulu' }
    ])
    const state = createServiceState()
    state.setRequiredAssetTypes(storedIds)
    state.setRequiredAssetTypes([])
    assertEquals(serviceAssetTypeOptions(catalog, stored), options)
    assertEquals(serviceAssetTypeOptions([], []), [])
    assertEquals(
      serviceAssetTypeLabels([active.id, deleted.id, inactive.id], [active, ...stored]),
      'Alpha (inactive), Bravo (deleted), Zulu'
    )
    assertEquals(serviceAssetTypeLabels([], []), '')
    const missing = id()
    await assertRejects(() => resolveServiceAssetTypes([missing], catalog))
  })
})

type Transport = {
  tables: Dictionary<Dictionary[]>
  requests: Request[]
  fail: string | undefined
}

const assetType = (label: string, active: boolean): AssetType => instantiable({ label, active })

// Isolate transport while exercising the production SDK, clients, scopes, and save delegate.
const withTransport = async (run: (test: Transport) => Promise<void>): Promise<void> => {
  const test: Transport = {
    tables: { services: [], service_required_asset_types: [], asset_types: [] },
    requests: [],
    fail: undefined
  }
  const original = Supabase.client
  const client = createClient('http://service-api.invalid', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input, init) => {
        const request = new Request(input, init)
        test.requests.push(request)
        const url = new URL(request.url)
        const table = url.pathname.slice('/rest/v1/'.length)
        assert(table in test.tables)
        if (test.fail === `${request.method} ${table}`) {
          test.fail = undefined
          return Response.json({ message: 'Injected failure' }, { status: 409 })
        }
        const rows = test.tables[table]
        if (request.method === 'POST') {
          const body = await request.json() as Dictionary | Dictionary[]
          rows.push(...Array.isArray(body) ? body : [body])
          return Response.json(body)
        }
        const visible = rows.filter(row =>
          [...url.searchParams].every(([key, value]) => {
            if (value === 'is.null') return row[key] === undefined || row[key] === null
            if (value.startsWith('eq.')) return row[key] === value.slice(3)
            if (value.startsWith('gt.')) return (row[key] as Id) > value.slice(3)
            if (value.startsWith('in.')) return value.slice(4, -1).split(',').includes(row[key] as Id)
            return true
          })
        )
        if (request.method === 'DELETE') {
          test.tables[table] = rows.filter(row => !visible.includes(row))
          return new Response(null, { status: 204 })
        }
        const single = request.headers.get('accept')?.includes('object')
        if ((single || request.method === 'PATCH') && visible.length === 0) {
          return Response.json({ code: 'PGRST116', message: 'No record' }, { status: 406 })
        }
        if (request.method === 'PATCH') {
          assertEquals(url.searchParams.get('deleted_at'), 'is.null')
          Object.assign(visible[0], await request.json())
          return Response.json(visible[0])
        }
        assertEquals(request.method, 'GET')
        const order = url.searchParams.get('order')?.split('.')[0]
        if (order) visible.sort((a, b) => String(a[order]).localeCompare(String(b[order])))
        return Response.json(single ? visible[0] : visible, {
          headers: { 'Content-Range': `*/${visible.length}` }
        })
      }
    }
  })
  Supabase.client = () => client
  try {
    await run(test)
  } finally {
    Supabase.client = original
  }
}
