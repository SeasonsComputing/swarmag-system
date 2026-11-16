/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Junction client tests                                                        ║
║ Verify junction membership and ordering through the Supabase SDK.            ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { makeJunctionSupabaseClient } from '@core/cli/make-supabase-client.ts'
import type {
  JunctionSupabaseSpecification,
  OrderedJunctionSupabaseSpecification
} from '@core/cli/make-supabase-client.ts'
import { Supabase } from '@core/db/supabase.ts'
import { id } from '@core/std'
import type { Dictionary, Id } from '@core/std'
import { ApiError, makeAdapter } from '@core/stdx'
import type { ApiJunctionContract } from '@core/stdx'
import type { ServiceRequiredAssetType } from '@domain/abstractions/service.ts'
import type { TaskQuestion } from '@domain/abstractions/workflow.ts'
import { ServiceRequiredAssetTypeAdapter } from '@domain/adapters/service-adapter.ts'
import { TaskQuestionAdapter } from '@domain/adapters/workflow-adapter.ts'
import { validateServiceRequiredAssetTypeCreate } from '@domain/validators/service-validator.ts'
import {
  validateTaskQuestionCreate,
  validateTaskQuestionUpdate
} from '@domain/validators/workflow-validator.ts'
import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert'
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
  failAt?: number
  failAfterWrite?: boolean
  noEffect?: boolean
  returnLimit?: number
  wrongWriteResult?: 'owner' | 'partner' | 'sequence'
  blockedPartner?: Id
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
    assert(reads.some(request => new URL(request.url).searchParams.has('or')))
  })
})

Deno.test('junction owner-set reads group complete pages and include empty owners', async () => {
  await withJunction(async test => {
    const owners = [id(), id(), id()].sort()
    const shared = id()
    const others = [id(), id(), id()].sort()
    test.rows.push(
      { service_id: owners[0], asset_type_id: shared },
      ...others.map(partner => ({ service_id: owners[0], asset_type_id: partner })),
      { service_id: owners[1], asset_type_id: shared },
      { service_id: id(), asset_type_id: shared }
    )
    const grouped = await test.client.partnersOf([...owners].reverse().concat(owners[0]))
    assertEquals(grouped.size, 3)
    assertEquals(grouped.get(owners[0]), [shared, ...others].sort())
    assertEquals(grouped.get(owners[1]), [shared])
    assertEquals(grouped.get(owners[2]), [])
    assertEquals(test.requests.length, 3)
    assert(test.requests.slice(1).every(request => new URL(request.url).searchParams.has('or')))
    assert(test.requests.every(request => request.method === 'GET'))
  })
})

Deno.test('junction owner-set reads split long lists without losing owners', async () => {
  await withJunction(async test => {
    const owners = Array.from({ length: 111 }, () => id())
    const shared = id()
    test.rows.push(
      ...owners.filter((_, index) => index % 3 === 0)
        .map(owner => ({ service_id: owner, asset_type_id: shared }))
    )
    const grouped = await test.client.partnersOf(owners)
    assertEquals(grouped.size, owners.length)
    for (const [index, owner] of owners.entries()) {
      assertEquals(grouped.get(owner), index % 3 === 0 ? [shared] : [])
    }
    const filters = new Set(
      test.requests.map(request => new URL(request.url).searchParams.get('service_id'))
    )
    assertEquals(filters.size, 3)
    for (const request of test.requests) {
      const url = new URL(request.url)
      assert(url.searchParams.get('service_id')!.slice(4, -1).split(',').length <= 50)
      assert(request.url.length < 2500)
    }
  })
})

Deno.test('junction empty sets skip reads and page failures reject the whole read', async () => {
  await withJunction(async test => {
    assertEquals(await test.client.partnersOf([]), new Map())
    assertEquals(test.requests, [])
    const owner = id()
    test.rows.push(...Array.from({ length: 3 }, () => ({ service_id: owner, asset_type_id: id() })))
    test.failAt = 2
    const error = await assertRejects(
      () => test.client.partnersOf([owner]),
      ApiError,
      'Injected failure'
    )
    assertEquals(error.status, 409)
    assertEquals(test.requests.length, 2)
    test.failAt = undefined
    assertEquals((await test.client.partnersOf([owner])).get(owner)?.length, 3)
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

/** Ordered specification uses the existing domain adapter and validators. */
const OrderedSpec: OrderedJunctionSupabaseSpecification<TaskQuestion> = {
  table: 'task_questions',
  adapter: TaskQuestionAdapter,
  validator: {
    validateCreate: validateTaskQuestionCreate,
    validateUpdate: validateTaskQuestionUpdate
  },
  owner: 'taskId',
  partner: 'questionId',
  sequence: 'sequence'
}

// Run the real SDK against a capped, in-memory PostgREST test endpoint.
const withJunction = async (
  run: (test: Harness) => Promise<void>,
  ordered = false
): Promise<void> => {
  const ownerColumn = ordered ? 'task_id' : 'service_id'
  const partnerColumn = ordered ? 'question_id' : 'asset_type_id'
  const pairColumns = `${ownerColumn},${partnerColumn}`
  const original = Supabase.client
  const test: Harness = {
    client: makeJunctionSupabaseClient(Spec),
    rows: [],
    requests: [],
    fail: undefined
  }
  const writeResponse = (rows: Dictionary[], status: number): Response => {
    if (!ordered) return new Response(null, { status })
    const returned = rows.slice(0, test.returnLimit ?? rows.length).map(row => ({ ...row }))
    if (returned.length && test.wrongWriteResult) {
      const column = test.wrongWriteResult === 'owner'
        ? ownerColumn
        : test.wrongWriteResult === 'partner'
        ? partnerColumn
        : 'sequence'
      returned[0][column] = column === 'sequence' ? -1 : id()
    }
    return Response.json(returned, { status })
  }
  const sdk = createClient('http://junction.test', 'public-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input, init) => {
        const request = new Request(input, init)
        test.requests.push(request)
        if (test.fail === request.method || test.failAt === test.requests.length) {
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
        assertEquals(
          url.pathname,
          `/rest/v1/${ordered ? 'task_questions' : 'service_required_asset_types'}`
        )
        const owner = url.searchParams.get(ownerColumn)?.slice(3)
        switch (request.method) {
          case 'GET': {
            if (url.searchParams.get('select') === (ordered ? `${pairColumns},sequence` : pairColumns)) {
              assertEquals(url.searchParams.get('order'), `${ownerColumn}.asc,${partnerColumn}.asc`)
              assertEquals(request.headers.get('prefer'), 'count=exact')
              const owners = url.searchParams.get(ownerColumn)!.slice(4, -1).split(',')
              const cursor = url.searchParams.get('or')?.match(
                new RegExp(
                  `^\\(${ownerColumn}.gt.([^,]+),and\\(${ownerColumn}.eq.([^,]+),${partnerColumn}.gt.([^)]+)\\)\\)$`
                )
              )
              if (url.searchParams.has('or')) assert(cursor)
              if (cursor) assertEquals(cursor[1], cursor[2])
              const filtered = test.rows.filter(row =>
                owners.includes(row[ownerColumn] as Id)
                && (!cursor || (row[ownerColumn] as Id) > cursor[1]
                  || (row[ownerColumn] === cursor[1] && (row[partnerColumn] as Id) > cursor[3]))
              ).sort((a, b) =>
                (a[ownerColumn] as Id).localeCompare(b[ownerColumn] as Id)
                || (a[partnerColumn] as Id).localeCompare(b[partnerColumn] as Id)
              )
              const rows = filtered.slice(0, Math.min(2, Number(url.searchParams.get('limit'))))
              return Response.json(rows, { headers: { 'Content-Range': `*/${filtered.length}` } })
            }
            assertEquals(url.searchParams.get('select'), 'asset_type_id')
            assertEquals(url.searchParams.get('order'), 'asset_type_id.asc')
            const after = url.searchParams.get(partnerColumn)?.slice(3)
            const rows = test.rows.filter(row =>
              row[ownerColumn] === owner && (after === undefined || (row[partnerColumn] as Id) > after)
            ).sort((a, b) => (a[partnerColumn] as Id).localeCompare(b[partnerColumn] as Id))
              .slice(0, Math.min(2, Number(url.searchParams.get('limit'))))
              .map(row => ({ asset_type_id: row[partnerColumn] }))
            return new Response(JSON.stringify(rows), {
              headers: { 'Content-Type': 'application/json' }
            })
          }
          case 'POST': {
            const rows = await request.clone().json() as Dictionary[]
            assert(rows.every(row =>
              Object.keys(row).sort().join()
                === (ordered ? 'question_id,sequence,task_id' : 'asset_type_id,service_id')
            ))
            const merging = url.searchParams.get('on_conflict') === pairColumns
            if (merging) assert(request.headers.get('prefer')?.includes('resolution=merge-duplicates'))
            for (const row of test.noEffect ? [] : rows) {
              const at = test.rows.findIndex(existing =>
                existing[ownerColumn] === row[ownerColumn]
                && existing[partnerColumn] === row[partnerColumn]
              )
              if (at < 0) test.rows.push(row)
              else {
                assert(merging)
                test.rows[at] = { ...test.rows[at], ...row }
              }
            }
            if (test.failAfterWrite) {
              test.failAfterWrite = false
              return Response.json(
                { message: 'Injected ambiguous failure', code: '23505' },
                { status: 409 }
              )
            }
            if (ordered) {
              assertEquals(url.searchParams.get('select'), `${pairColumns},sequence`)
              assert(request.headers.get('prefer')?.includes('return=representation'))
            }
            return writeResponse(test.noEffect ? [] : rows, 201)
          }
          case 'DELETE': {
            const removed = url.searchParams.get(partnerColumn)!.slice(4, -1).split(',')
            const affected = test.rows.filter(row =>
              !test.noEffect && row[ownerColumn] === owner
              && removed.includes(row[partnerColumn] as Id)
              && row[partnerColumn] !== test.blockedPartner
            )
            const kept = test.rows.filter(row => !affected.includes(row))
            test.rows.splice(0, test.rows.length, ...kept)
            if (ordered) {
              assertEquals(url.searchParams.get('select'), pairColumns)
              assert(request.headers.get('prefer')?.includes('return=representation'))
            }
            return writeResponse(affected, ordered ? 200 : 204)
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

Deno.test('ordered reads paginate by membership keys and return sequence order for every owner', async () => {
  await withJunction(async test => {
    const client = makeJunctionSupabaseClient(OrderedSpec)
    const owner = id()
    const other = id()
    const empty = id()
    const partners = Array.from({ length: 7 }, () => id())
    const ordered = [...partners].reverse()
    test.rows.push(
      ...ordered.map((partner, index) => ({
        task_id: owner,
        question_id: partner,
        sequence: index + 1
      })),
      { task_id: other, question_id: partners[0], sequence: 10 }
    )
    assertEquals(await client.partners(owner), ordered)
    const grouped = await client.partnersOf([owner, other, empty, owner])
    assertEquals(grouped.size, 3)
    assertEquals(grouped.get(owner), ordered)
    assertEquals(grouped.get(other), [partners[0]])
    assertEquals(grouped.get(empty), [])
    const before = test.requests.length
    assertEquals(await client.partnersOf([]), new Map())
    assertEquals(test.requests.length, before)
    assert(test.requests.some(request => new URL(request.url).searchParams.has('or')))
  }, true)
})

Deno.test('ordered replacement writes membership and order, skips unchanged rows, and replays', async () => {
  await withJunction(async test => {
    const client = makeJunctionSupabaseClient(OrderedSpec)
    const owner = id()
    const other = id()
    const [first, second, third] = [id(), id(), id()]
    await client.replace(owner, [first, second])
    await client.replace(other, [first])
    await client.replace(owner, [second, first])
    assertEquals(await client.partners(owner), [second, first])
    const before = test.requests.filter(request => request.method !== 'GET').length
    await client.replace(owner, [second, first])
    assertEquals(test.requests.filter(request => request.method !== 'GET').length, before)
    test.fail = 'POST'
    await assertRejects(() => client.replace(owner, [first, third]), ApiError, 'Injected failure')
    assertEquals(await client.partners(owner), [first])
    await client.replace(owner, [first, third])
    assertEquals(await client.partners(owner), [first, third])
    assertEquals(await client.partners(other), [first])
    await client.replace(owner, [])
    assertEquals(await client.partners(owner), [])
  }, true)
})

Deno.test('ordered replacement validates duplicates and all changed rows before writing', async () => {
  await withJunction(async test => {
    const owner = id()
    const [first, second, third] = [id(), id(), id()]
    const client = makeJunctionSupabaseClient(OrderedSpec)
    await client.replace(owner, [first, second])
    const before = test.requests.length
    await assertRejects(() => client.replace(owner, [first, first]), ApiError, 'Duplicate')
    await assertRejects(() => client.replace(owner, [third, 'invalid']), ApiError)
    const rejecting = makeJunctionSupabaseClient({
      ...OrderedSpec,
      validator: {
        ...OrderedSpec.validator,
        validateUpdate: (_input: TaskQuestion) => 'Update refused'
      }
    })
    await assertRejects(() => rejecting.replace(owner, [second, third]), ApiError, 'Update refused')
    assert(test.requests.slice(before).every(request => request.method === 'GET'))
    assertEquals(await client.partners(owner), [first, second])
  }, true)
})

Deno.test('bound list swaps adjacent links in one write and removal preserves gaps', async () => {
  await withJunction(async test => {
    const client = makeJunctionSupabaseClient(OrderedSpec)
    const owner = id()
    const [first, second, third, fourth] = [id(), id(), id(), id()]
    test.rows.push(
      { task_id: owner, question_id: first, sequence: 10 },
      { task_id: owner, question_id: second, sequence: 20 },
      { task_id: owner, question_id: third, sequence: 30 }
    )
    const list = await client.list(owner)
    const snapshot = list.items() as Id[]
    snapshot.reverse()
    assertEquals(list.items(), [first, second, third])
    const before = test.requests.length
    await list.moveBack(first)
    await list.moveForward(third)
    assertEquals(test.requests.length, before)
    await list.moveForward(first)
    assertEquals(test.requests.length, before + 1)
    assertEquals(test.requests.at(-1)?.method, 'POST')
    const swapped = await test.requests.at(-1)!.clone().json()
    assertEquals(swapped.length, 2)
    assertEquals(list.items(), [second, first, third])
    await list.moveBack(third)
    assertEquals(list.items(), [second, third, first])
    const beforeDelete = test.requests.length
    await list.remove(third)
    assertEquals(test.requests.length, beforeDelete + 1)
    assertEquals(test.requests.at(-1)?.method, 'DELETE')
    assertEquals(test.rows.map(row => row.sequence).sort(), [10, 30])
    await list.add(fourth)
    assertEquals(test.rows.find(row => row.question_id === fourth)?.sequence, 31)
    assertEquals(list.items(), [second, first, fourth])
    assertEquals(await client.partners(owner), list.items())
  }, true)
})

Deno.test('bound list serializes commands and rejects invalid membership without invalidating', async () => {
  await withJunction(async test => {
    const client = makeJunctionSupabaseClient(OrderedSpec)
    const owner = id()
    const list = await client.list(owner)
    const [first, second] = [id(), id()]
    await Promise.all([list.add(first), list.add(second), list.moveBack(second)])
    assertEquals(list.items(), [second, first])
    const before = test.requests.length
    await assertRejects(() => list.add(first), ApiError, 'already linked')
    await assertRejects(() => list.remove(id()), ApiError, 'not linked')
    await assertRejects(() => list.moveBack(id()), ApiError, 'not linked')
    await assertRejects(() => list.add('invalid'), ApiError)
    assertEquals(test.requests.length, before)
    assertEquals(list.items(), [second, first])
    await list.remove(second)
    await list.remove(first)
    await list.add(first)
    assertEquals(test.rows[0].sequence, 1)
  }, true)
})

Deno.test('failed list writes invalidate snapshots and queued commands until the list is reopened', async () => {
  for (const operation of ['add', 'remove', 'moveForward'] as const) {
    await withJunction(async test => {
      const client = makeJunctionSupabaseClient(OrderedSpec)
      const owner = id()
      const [first, second] = [id(), id()]
      await client.replace(owner, [first, second])
      const list = await client.list(owner)
      test.fail = operation === 'remove' ? 'DELETE' : 'POST'
      const target = operation === 'add' ? id() : first
      const before = test.requests.length
      const failed = list[operation](target)
      const queued = list.add(id())
      await assertRejects(() => failed, ApiError, 'Injected failure')
      await assertRejects(() => queued, ApiError, 'Reopen')
      assertEquals(test.requests.length, before + 1)
      assertThrows(() => list.items(), ApiError, 'Reopen')
      const reopened = await client.list(owner)
      assertEquals(reopened.items(), [first, second])
      await reopened.moveForward(first)
      assertEquals(reopened.items(), [second, first])
    }, true)
  }
})

Deno.test('ordered reads reject page failures and list opening rejects ambiguous positions', async () => {
  await withJunction(async test => {
    const client = makeJunctionSupabaseClient(OrderedSpec)
    const owner = id()
    const partners = [id(), id(), id()]
    test.rows.push(...partners.map(partner => ({ task_id: owner, question_id: partner, sequence: 1 })))
    test.failAt = 2
    await assertRejects(() => client.partners(owner), ApiError, 'Injected failure')
    test.failAt = undefined
    assertEquals(await client.partners(owner), partners.sort())
    const beforeList = test.requests.length
    await assertRejects(() => client.list(owner), ApiError, 'distinct sequence')
    assert(test.requests.slice(beforeList).every(request => request.method === 'GET'))
    await client.replace(owner, partners)
    assertEquals((await client.list(owner)).items(), partners)
  }, true)
})

Deno.test('ordered specifications require numeric sequence fields and an update validator', () => {
  // @ts-expect-error Ordered junctions require both create and update validators.
  const missingUpdate = makeJunctionSupabaseClient({
    ...OrderedSpec,
    validator: { validateCreate: validateTaskQuestionCreate }
  })
  const wrongSequence: OrderedJunctionSupabaseSpecification<TaskQuestion> = {
    ...OrderedSpec,
    // @ts-expect-error An identifier field cannot be the sequence field.
    sequence: 'taskId'
  }
  assertEquals(typeof missingUpdate.partners, 'function')
  assertEquals(wrongSequence.sequence, 'taskId')
})

Deno.test('a committed move with a failed response is reconciled by reopening, not replayed', async () => {
  await withJunction(async test => {
    const client = makeJunctionSupabaseClient(OrderedSpec)
    const owner = id()
    const [first, second, third] = [id(), id(), id()]
    await client.replace(owner, [first, second, third])
    const list = await client.list(owner)
    test.failAfterWrite = true
    await assertRejects(() => list.moveForward(first), ApiError, 'ambiguous failure')
    assertThrows(() => list.items(), ApiError, 'Reopen')
    assertEquals((await client.list(owner)).items(), [second, first, third])
  }, true)
})

Deno.test('ordered owner-set reads batch owners while preserving each sequence', async () => {
  await withJunction(async test => {
    const client = makeJunctionSupabaseClient(OrderedSpec)
    const owners = Array.from({ length: 55 }, () => id())
    const [first, second] = [id(), id()]
    test.rows.push(...owners.flatMap(owner => [
      { task_id: owner, question_id: first, sequence: 20 },
      { task_id: owner, question_id: second, sequence: 10 }
    ]))
    const grouped = await client.partnersOf(owners)
    assertEquals(grouped.size, owners.length)
    for (const owner of owners) assertEquals(grouped.get(owner), [second, first])
    const filters = new Set(
      test.requests.map(request => new URL(request.url).searchParams.get('task_id'))
    )
    assertEquals(filters.size, 2)
    assert(test.requests.every(request => request.method === 'GET'))
  }, true)
})

Deno.test('zero-effect writes reject and cannot publish a false bound-list snapshot', async () => {
  for (const operation of ['add', 'remove', 'moveForward'] as const) {
    await withJunction(async test => {
      const client = makeJunctionSupabaseClient(OrderedSpec)
      const owner = id()
      const [first, second] = [id(), id()]
      await client.replace(owner, [first, second])
      const list = await client.list(owner)
      test.noEffect = true
      const target = operation === 'add' ? id() : first
      const error = await assertRejects(() => list[operation](target), ApiError, 'does not confirm')
      assertEquals(error.status, 409)
      assertThrows(() => list.items(), ApiError, 'Reopen')
      test.noEffect = false
      assertEquals((await client.list(owner)).items(), [first, second])
    }, true)
  }
})

Deno.test('partial delete confirmation stops replacement before changing retained positions', async () => {
  await withJunction(async test => {
    const client = makeJunctionSupabaseClient(OrderedSpec)
    const owner = id()
    const [first, second, third] = [id(), id(), id()]
    await client.replace(owner, [first, second, third])
    test.blockedPartner = second
    const before = test.requests.length
    await assertRejects(() => client.replace(owner, [third]), ApiError, 'does not confirm')
    assert(test.requests.slice(before).every(request => request.method !== 'POST'))
    assertEquals(await client.partners(owner), [second, third])
    assertEquals(test.rows.find(row => row.question_id === third)?.sequence, 3)
    test.blockedPartner = undefined
    await client.replace(owner, [third])
    assertEquals(await client.partners(owner), [third])
    assertEquals(test.rows[0].sequence, 1)
  }, true)
})

Deno.test('confirmation checks returned owner, partner, and position before publishing state', async () => {
  for (const field of ['owner', 'partner', 'sequence'] as const) {
    await withJunction(async test => {
      const client = makeJunctionSupabaseClient(OrderedSpec)
      const owner = id()
      const [first, second] = [id(), id()]
      await client.replace(owner, [first, second])
      const list = await client.list(owner)
      test.wrongWriteResult = field
      await assertRejects(() => list.moveForward(first), ApiError, 'does not confirm')
      assertThrows(() => list.items(), ApiError, 'Reopen')
      // The write committed; its mismatched response must not cause an automatic second move.
      assertEquals((await client.list(owner)).items(), [second, first])
    }, true)
  }
})

Deno.test('incomplete move representation invalidates the list until persisted order is reloaded', async () => {
  await withJunction(async test => {
    const client = makeJunctionSupabaseClient(OrderedSpec)
    const owner = id()
    const [first, second, third] = [id(), id(), id()]
    await client.replace(owner, [first, second, third])
    const list = await client.list(owner)
    test.returnLimit = 1
    await assertRejects(() => list.moveForward(first), ApiError, 'does not confirm')
    assertThrows(() => list.items(), ApiError, 'Reopen')
    assertEquals((await client.list(owner)).items(), [second, first, third])
  }, true)
})
