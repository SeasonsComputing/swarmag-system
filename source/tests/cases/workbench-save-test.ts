/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Aggregate save tests                                                         ║
║ Verify ordered writes, retained records, and editor session isolation.       ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { assertEquals, assertRejects } from '@std/assert'
import { makeAggregateSave } from '@ux/shell/workbench/workbench-save.ts'

Deno.test('aggregate writes precede completion and return persisted records', async () => {
  const calls: string[] = []
  const save = makeAggregateSave<number, number>({
    create: draft => {
      calls.push(`create ${draft}`)
      return Promise.resolve(draft)
    },
    update: (record, draft) => {
      calls.push(`update ${record} ${draft}`)
      return Promise.resolve(draft)
    },
    complete: (record, draft) => {
      calls.push(`complete ${record} ${draft}`)
      return Promise.resolve()
    }
  })
  assertEquals(await save.create(1), 1)
  assertEquals(await save.update(1, 2), 2)
  assertEquals(await save.create(3), 3)
  assertEquals(calls, [
    'create 1',
    'complete 1 1',
    'update 1 2',
    'complete 2 2',
    'create 3',
    'complete 3 3'
  ])
})

Deno.test('aggregate retries update the latest persisted record with the current draft', async () => {
  const calls: string[] = []
  let failUpdate = false
  let failComplete = true
  const save = makeAggregateSave<number, number>({
    create: draft => {
      calls.push(`create ${draft}`)
      return Promise.resolve(draft)
    },
    update: (record, draft) => {
      calls.push(`update ${record} ${draft}`)
      return failUpdate ? Promise.reject(new Error('update failed')) : Promise.resolve(draft)
    },
    complete: (record, draft) => {
      calls.push(`complete ${record} ${draft}`)
      return failComplete ? Promise.reject(new Error('complete failed')) : Promise.resolve()
    }
  })
  await assertRejects(() => save.create(1), Error, 'complete failed')
  await assertRejects(() => save.create(2), Error, 'complete failed')
  failUpdate = true
  await assertRejects(() => save.create(3), Error, 'update failed')
  failUpdate = false
  failComplete = false
  assertEquals(await save.create(4), 4)
  assertEquals(calls, [
    'create 1',
    'complete 1 1',
    'update 1 2',
    'complete 2 2',
    'update 2 3',
    'update 2 4',
    'complete 4 4'
  ])
})

Deno.test('aggregate update retries use the latest persisted record', async () => {
  const records: number[] = []
  let fail = true
  const save = makeAggregateSave<number, number>({
    create: draft => Promise.resolve(draft),
    update: (record, draft) => {
      records.push(record)
      return Promise.resolve(draft)
    },
    complete: () => fail ? Promise.reject(new Error('complete failed')) : Promise.resolve()
  })
  await assertRejects(() => save.update(1, 2))
  fail = false
  assertEquals(await save.update(1, 3), 3)
  assertEquals(records, [1, 2])
})

Deno.test('aggregate creation failures and editor sessions stay isolated', async () => {
  let creates = 0
  let completes = 0
  const spec = {
    create: () => {
      creates++
      return creates === 1 ? Promise.reject(new Error('create failed')) : Promise.resolve(creates)
    },
    update: () => Promise.resolve(100),
    complete: () => {
      completes++
      return Promise.reject(new Error('complete failed'))
    }
  }
  const first = makeAggregateSave(spec)
  await assertRejects(() => first.create(undefined), Error, 'create failed')
  assertEquals(completes, 0)
  await assertRejects(() => first.create(undefined), Error, 'complete failed')
  const second = makeAggregateSave(spec)
  await assertRejects(() => second.create(undefined), Error, 'complete failed')
  assertEquals(creates, 3)
  assertEquals(completes, 2)
})
