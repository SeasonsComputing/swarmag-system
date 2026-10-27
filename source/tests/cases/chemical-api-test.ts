/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Chemical API integration tests                                               ║
║ Exercise composed clients and owned scopes through an in-memory transport.   ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { Config } from '@core/cfg/config.ts'
import { Supabase } from '@core/db/supabase.ts'
import { isId } from '@core/std'
import type { Dictionary } from '@core/std'
import { scopes } from '@front/api/scopes.ts'
import { chemicalDraft, createChemicalState } from '@front/app-admin/chemicals/chemical-state.ts'
import { assert, assertEquals, assertRejects } from '@std/assert'
import { createClient } from '@supabase/client'

Config.init({
  get: key => key === 'LOCAL_DB_NAME' ? 'chemical-api-test' : undefined,
  fail: message => {
    throw new Error(message)
  }
}, ['LOCAL_DB_NAME'])
const { api } = await import('@front/api/api.ts')

Deno.test('Chemical client exercises CRUD and soft deletion', async () => {
  await withTransport(async () => {
    const chemicalState = createChemicalState()
    chemicalState.setName('  Reference chemical  ')
    chemicalState.setEpaNumber('ABC')
    const chemical = await api.Chemicals.create(
      scopes.Chemicals.detail.toCreate(chemicalDraft(chemicalState))
    )
    assertEquals(chemical.name, 'Reference chemical')
    assertEquals(chemical.labels, [])
    chemicalState.setEpaNumber(' ')
    chemicalState.setReEntryIntervalHours(24)
    const changed = await api.Chemicals.update(
      scopes.Chemicals.detail.adapter,
      scopes.Chemicals.detail.toUpdate(chemical.id, chemicalDraft(chemicalState))
    )
    assertEquals(changed.epaNumber, undefined)
    assertEquals((await api.Chemicals.get(chemical.id)).reEntryIntervalHours, 24)
    assertEquals((await api.Chemicals.list()).data.length, 1)

    const removed = await api.Chemicals.delete(chemical.id)
    assertEquals(removed.id, chemical.id)
    assert(removed.deletedAt)
    assertEquals((await api.Chemicals.get(chemical.id)).deletedAt, removed.deletedAt)
    assertEquals((await api.Chemicals.list()).data, [])
    await assertRejects(() => api.Chemicals.delete(chemical.id))
  })
})

Deno.test('Chemical updates preserve labels and clear owned optionals', async () => {
  await withTransport(async tables => {
    const state = createChemicalState()
    state.setName('Chemical with documents')
    state.setSdsUrl('https://example.com/sds.pdf')
    state.setReEntryIntervalHours(12)
    const created = await api.Chemicals.create(scopes.Chemicals.detail.toCreate(chemicalDraft(state)))
    const labels = [{ url: 'https://example.com/label.pdf', description: 'Keep label' }]
    tables.chemicals[0].labels = labels
    state.setSdsUrl(' ')
    state.setReEntryIntervalHours(undefined)
    const updated = await api.Chemicals.update(
      scopes.Chemicals.detail.adapter,
      scopes.Chemicals.detail.toUpdate(created.id, chemicalDraft(state))
    )
    assertEquals(updated.labels, labels)
    assertEquals(updated.sdsUrl, undefined)
    assertEquals(updated.reEntryIntervalHours, undefined)
    assertEquals(tables.chemicals[0].labels, labels)
  })
})

Deno.test('Chemical client enforces validators before dispatch', async () => {
  await withTransport(async tables => {
    await assertRejects(() =>
      api.Chemicals.create({
        name: '',
        usage: 'herbicide',
        signalWord: 'none',
        restrictedUse: false,
        labels: [],
        notes: []
      })
    )
    assertEquals(tables, { chemicals: [] })
  })
})

// Isolate only transport; exercise the production SDK, adapters, scopes, and validators.
const withTransport = async (
  run: (tables: Dictionary<Dictionary[]>) => Promise<void>
): Promise<void> => {
  const tables: Dictionary<Dictionary[]> = { chemicals: [] }
  const original = Supabase.client
  const client = createClient('http://chemical-api.invalid', 'test-key', {
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
