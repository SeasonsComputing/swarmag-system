/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Junction client tests                                                        ║
║ Verify unordered membership through the Supabase SDK without a database.    ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { makeJunctionSupabaseClient } from '@core/cli/make-supabase-client.ts'
import type { JunctionSupabaseSpecification } from '@core/cli/make-supabase-client.ts'
import { Supabase } from '@core/db/supabase.ts'
import { id } from '@core/std'
import type { Dictionary, Id } from '@core/std'
import { ApiError, makeAdapter } from '@core/stdx'
import type { ApiJunctionContract } from '@core/stdx'
import type { ServiceRequiredAssetType } from '@domain/abstractions/service.ts'
import type { TaskQuestion } from '@domain/abstractions/workflow.ts'
import { ServiceRequiredAssetTypeAdapter } from '@domain/adapters/service-adapter.ts'
import { validateServiceRequiredAssetTypeCreate } from '@domain/validators/service-validator.ts'
import { assert, assertEquals, assertRejects } from '@std/assert'
import { createClient } from '@supabase/client'

/** Specification using the real service junction adapter and validator. */
const Spec: JunctionSupabaseSpecification<ServiceRequiredAssetType> = {
  table: 'service_required_asset_types',
  adapter: ServiceRequiredAssetTypeAdapter,
  validator: { validateCreate: validateServiceRequiredAssetTypeCreate },
  owner: 'serviceId',
  partner: 'assetTypeId'
}

/** Mutable test store and observed SDK requests. */
type Harness = {
  client: ApiJunctionContract
  rows: Dictionary[]
  requests: Request[]
  fail: string | undefined
}

Deno.test('junction membership round-trips, replaces as a set, and isolates owners', async () => {
  await withJunction(async test => {
    const owner = id()
    const other = id()
    const first = id()
    const second = id()
    const third = id()
    assertEquals(await test.client.partners(owner), [])
    await test.client.replace(owner, [first, second, first])
    await test.client.replace(other, [first])
    assertEquals((await test.client.partners(owner)).length, 2)
    const writes = () => test.requests.filter(request => request.method !== 'GET').length
    const before = writes()
    await test.client.replace(owner, [second, first, second])
    assertEquals(writes(), before)
    await test.client.replace(owner, [second, third])
    assertEquals([...(await test.client.partners(owner))].sort(), [second, third].sort())
    assertEquals(await test.client.partners(other), [first])
    await test.client.replace(owner, [])
    assertEquals(await test.client.partners(owner), [])
    assertEquals(await test.client.partners(other), [first])
    assert(test.requests.every(request => !new URL(request.url).searchParams.has('deleted_at')))
    assert(test.requests.every(request => request.method !== 'PATCH'))
  })
})

Deno.test('junction reads and replaces complete membership despite a smaller provider cap', async () => {
  await withJunction(async test => {
    const owner = id()
    const members = Array.from({ length: 7 }, () => id()).sort()
    test.rows.push(...members.map(partner => ({ service_id: owner, asset_type_id: partner })))
    assertEquals(await test.client.partners(owner), members)
    await test.client.replace(owner, [members[6]])
    assertEquals(await test.client.partners(owner), [members[6]])
    const reads = test.requests.filter(request => request.method === 'GET')
    assert(reads.some(request => new URL(request.url).searchParams.has('asset_type_id')))
  })
})

Deno.test('junction validates all additions before deleting or inserting', async () => {
  await withJunction(async test => {
    const owner = id()
    const existing = id()
    await test.client.replace(owner, [existing])
    const before = test.requests.length
    const error = await assertRejects(
      () => test.client.replace(owner, [id(), 'invalid']),
      ApiError
    )
    assertEquals(error.status, 422)
    assert(test.requests.slice(before).every(request => request.method === 'GET'))
    assertEquals(await test.client.partners(owner), [existing])
  })
})

Deno.test('junction maps provider failures and stops after a failed read or delete', async () => {
  for (const method of ['GET', 'DELETE']) {
    await withJunction(async test => {
      const owner = id()
      const existing = id()
      await test.client.replace(owner, [existing])
      test.fail = method
      const before = test.requests.length
      const error = await assertRejects(() => test.client.replace(owner, [id()]), ApiError)
      assertEquals(error.status, 409)
      assertEquals(error.message, 'Injected failure')
      assertEquals(error.details, 'test detail')
      assertEquals(test.requests.at(-1)?.method, method)
      assert(!test.requests.slice(before).some(request => request.method === 'POST'))
      assertEquals(await test.client.partners(owner), [existing])
    })
  }
})

Deno.test('junction replay converges after deletion succeeds and insertion fails', async () => {
  await withJunction(async test => {
    const owner = id()
    const retained = id()
    const added = id()
    await test.client.replace(owner, [id(), retained])
    test.fail = 'POST'
    const error = await assertRejects(() => test.client.replace(owner, [retained, added]), ApiError)
    assertEquals(error.status, 409)
    assertEquals(await test.client.partners(owner), [retained])
    await test.client.replace(owner, [retained, added])
    assertEquals([...(await test.client.partners(owner))].sort(), [retained, added].sort())
    const before = test.requests.filter(request => request.method === 'POST').length
    await test.client.replace(owner, [retained, added])
    assertEquals(test.requests.filter(request => request.method === 'POST').length, before)
  })
})

Deno.test('junction sides reject unknown fields and existing numeric fields at compile time', () => {
  const unknown: JunctionSupabaseSpecification<ServiceRequiredAssetType> = {
    ...Spec,
    // @ts-expect-error A side must name a field of the junction.
    owner: 'missing'
  }
  const numeric: JunctionSupabaseSpecification<TaskQuestion> = {
    table: 'task_questions',
    adapter: makeAdapter<TaskQuestion>({
      taskId: ['task_id'],
      questionId: ['question_id'],
      sequence: ['sequence']
    }),
    validator: { validateCreate: () => null },
    owner: 'taskId',
    // @ts-expect-error A numeric field cannot name an identifier side.
    partner: 'sequence'
  }
  assertEquals(unknown.owner, 'missing')
  assertEquals(numeric.partner, 'sequence')
})

// Run the real SDK against a capped, in-memory PostgREST test endpoint.
const withJunction = async (run: (test: Harness) => Promise<void>): Promise<void> => {
  const original = Supabase.client
  const test: Harness = {
    client: makeJunctionSupabaseClient(Spec),
    rows: [],
    requests: [],
    fail: undefined
  }
  const sdk = createClient('http://junction.test', 'public-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input, init) => {
        const request = new Request(input, init)
        test.requests.push(request)
        if (test.fail === request.method) {
          test.fail = undefined
          return new Response(
            JSON.stringify({
              code: '23505',
              message: 'Injected failure',
              details: 'test detail'
            }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
          )
        }
        const url = new URL(request.url)
        assertEquals(url.pathname, '/rest/v1/service_required_asset_types')
        const owner = url.searchParams.get('service_id')?.slice(3)
        switch (request.method) {
          case 'GET': {
            assertEquals(url.searchParams.get('select'), 'asset_type_id')
            assertEquals(url.searchParams.get('order'), 'asset_type_id.asc')
            const after = url.searchParams.get('asset_type_id')?.slice(3)
            const rows = test.rows.filter(row =>
              row.service_id === owner && (after === undefined || (row.asset_type_id as Id) > after)
            ).sort((a, b) => (a.asset_type_id as Id).localeCompare(b.asset_type_id as Id))
              .slice(0, Math.min(2, Number(url.searchParams.get('limit'))))
              .map(row => ({ asset_type_id: row.asset_type_id }))
            return new Response(JSON.stringify(rows), {
              headers: { 'Content-Type': 'application/json' }
            })
          }
          case 'POST': {
            const rows = await request.json() as Dictionary[]
            assert(rows.every(row => Object.keys(row).sort().join() === 'asset_type_id,service_id'))
            for (const row of rows) {
              assert(
                !test.rows.some(existing =>
                  existing.service_id === row.service_id && existing.asset_type_id === row.asset_type_id
                )
              )
            }
            test.rows.push(...rows)
            return new Response(null, { status: 201 })
          }
          case 'DELETE': {
            const removed = url.searchParams.get('asset_type_id')!.slice(4, -1).split(',')
            const kept = test.rows.filter(row =>
              row.service_id !== owner || !removed.includes(row.asset_type_id as Id)
            )
            test.rows.splice(0, test.rows.length, ...kept)
            return new Response(null, { status: 204 })
          }
          default:
            throw new Error(`Unexpected junction request: ${request.method}`)
        }
      }
    }
  })
  Supabase.client = () => sdk
  try {
    await run(test)
  } finally {
    Supabase.client = original
  }
}
