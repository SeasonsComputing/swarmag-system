/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Admin drain scheduling tests                                                 ║
║ Verify per-pair loops, lock exclusion, failure pacing, and surfaced errors.  ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { Config } from '@core/cfg/config.ts'
import type { StringDictionary } from '@core/std'
import { ApiError } from '@core/stdx'
import { assertEquals, assertRejects } from '@std/assert'
import { BackgroundTasks } from '@ux/shell/runtime/background-tasks.ts'

Deno.test('DocumentDrain runs a loop per pair, backs off, and surfaces unexpected errors', async () => {
  const Values: StringDictionary = {
    SUPABASE_RDBMS_URL: 'http://drain.test',
    SUPABASE_PUBLIC_KEY: 'drain-public-key',
    SUPABASE_CLIENT_MODE: 'edge',
    ATTACHMENTS_SERVER_ROOT: 'offline-attachments',
    FIELD_BINDER_SERVER_ROOT: 'offline-binder',
    FIELD_BINDER_INBOX_DB_NAME: 'document-drain-binder-inbox',
    FIELD_BINDER_DB_NAME: 'document-drain-binder',
    DOCUMENT_INBOX_DB_NAME: 'drain-test-inbox',
    LOCAL_DB_NAME: 'drain-test'
  }
  Config.init({
    get: name => Values[name],
    fail: message => {
      throw new Error(message)
    }
  }, Object.keys(Values))
  const { api } = await import('@front/api/api.ts')
  const { DocumentDrain } = await import('@front/app-admin/document-drain.ts')
  const drain = api.AttachmentsUploads.drain
  const binderDrain = api.FieldBinderUploads.drain
  const prepared = api.SessionState.isPrepared
  let ready = false
  api.SessionState.isPrepared = () => ready
  // The test runs passes one at a time, so the lock last requested names the loop that schedules.
  // Start runs both first passes together; relabel() re-runs them one at a time to name them.
  let requesting = ''
  const scheduled = new Map<string, () => Promise<void>>()
  const queued: (() => Promise<void>)[] = []
  const scheduledDelays = new Map<string, number[]>()
  const scheduledPass = (lock = 'document-drain'): Promise<void> => scheduled.get(lock)!()
  const relabel = async (): Promise<void> => {
    const passes = queued.splice(0)
    scheduled.clear()
    scheduledDelays.clear()
    delays.length = 0
    for (const pass of passes) await pass()
  }
  const timeout = globalThis.setTimeout
  const locks = Object.getOwnPropertyDescriptor(navigator, 'locks')
  const delays: number[] = []
  let binderRemaining = 0
  let binderCalls = 0
  let available = true
  let lockFailure: Error | undefined
  let failure: Error | undefined
  let calls = 0
  let remaining = 0
  let pending: Promise<{ drained: number; remaining: number }> | undefined
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: async (
        name: string,
        options: LockOptions,
        callback: (lock: Lock | null) => Promise<void>
      ) => {
        requesting = name
        assertEquals(['document-drain', 'field-binder-drain'].includes(name), true)
        assertEquals(options, { ifAvailable: true })
        if (lockFailure) throw lockFailure
        await callback(available ? { name, mode: 'exclusive' } : null)
      }
    }
  })
  globalThis.setTimeout = ((callback: TimerHandler, delay?: number) => {
    scheduled.set(requesting, callback as () => Promise<void>)
    queued.push(callback as () => Promise<void>)
    scheduledDelays.set(requesting, [...scheduledDelays.get(requesting) ?? [], delay!])
    if (requesting === 'document-drain') delays.push(delay!)
    return 1
  }) as typeof setTimeout
  api.FieldBinderUploads.drain = () => {
    binderCalls++
    assertEquals(BackgroundTasks.store['field-binder-delivery'].phase, 'running')
    assertEquals(BackgroundTasks.store['attachment-delivery'], undefined)
    return Promise.resolve({ drained: 0, remaining: binderRemaining })
  }
  api.AttachmentsUploads.drain = () => {
    calls++
    assertEquals(BackgroundTasks.store['attachment-delivery'].phase, 'running')
    assertEquals(BackgroundTasks.store['attachment-delivery'].blocksExit, true)
    assertEquals(BackgroundTasks.store['attachment-delivery'].remaining, undefined)
    if (pending) return pending
    if (failure) return Promise.reject(failure)
    return Promise.resolve({ drained: 0, remaining })
  }
  try {
    await DocumentDrain.start()
    await relabel()
    assertEquals(calls, 0)
    assertEquals(delays, [60_000])
    ready = true
    await DocumentDrain.start()
    assertEquals(calls, 0)
    assertEquals(scheduledDelays.get('field-binder-drain'), [60_000])
    await scheduledPass()
    assertEquals(calls, 1)
    assertEquals(delays, [60_000, 60_000])
    assertEquals(Object.keys(BackgroundTasks.store), [])
    binderRemaining = 2
    await scheduledPass('field-binder-drain')
    assertEquals(binderCalls, 1)
    assertEquals(BackgroundTasks.store['field-binder-delivery'].remaining, {
      count: 2,
      unit: 'documents'
    })
    assertEquals(BackgroundTasks.store['attachment-delivery'], undefined)
    binderRemaining = 0
    await scheduledPass('field-binder-drain')
    assertEquals(Object.keys(BackgroundTasks.store), [])
    assertEquals(scheduledDelays.get('field-binder-drain'), [60_000, 60_000, 60_000])
    remaining = 3
    await scheduledPass()
    assertEquals(BackgroundTasks.store['attachment-delivery'].remaining, { count: 3, unit: 'documents' })
    assertEquals(BackgroundTasks.store['attachment-delivery'].phase, 'waiting')
    assertEquals(BackgroundTasks.store['attachment-delivery'].blocksExit, true)
    failure = new AggregateError([new ApiError('Upload failed', 503)])
    await scheduledPass()
    assertEquals(BackgroundTasks.store['attachment-delivery'].phase, 'failed')
    assertEquals(BackgroundTasks.store['attachment-delivery'].remaining, undefined)
    assertEquals(BackgroundTasks.store['attachment-delivery'].blocksExit, true)
    failure = new ApiError('List failed', 503)
    await scheduledPass()
    await scheduledPass()
    await scheduledPass()
    await scheduledPass()
    assertEquals(delays, [60_000, 60_000, 60_000, 120_000, 240_000, 480_000, 900_000, 900_000])
    available = false
    const beforeSkip = calls
    await scheduledPass()
    assertEquals(calls, beforeSkip)
    assertEquals(Object.keys(BackgroundTasks.store), [])
    assertEquals(delays.at(-1), 900_000)
    available = true
    failure = undefined
    await scheduledPass()
    assertEquals(delays.at(-1), 60_000)
    remaining = 0
    await scheduledPass()
    assertEquals(Object.keys(BackgroundTasks.store), [])
    const { SessionCoordinator } = await import('@front/app/shell/session-coordinator.ts')
    for (const rejected of [false, true]) {
      const deferred = Promise.withResolvers<{ drained: number; remaining: number }>()
      pending = deferred.promise
      const pass = scheduledPass()
      assertEquals(BackgroundTasks.store['attachment-delivery'].phase, 'running')
      ready = false
      SessionCoordinator.clear()
      assertEquals(Object.keys(BackgroundTasks.store), [])
      if (rejected) deferred.reject(new ApiError('Signed-out pass failed', 503))
      else deferred.resolve({ drained: 0, remaining: 4 })
      await pass
      assertEquals(Object.keys(BackgroundTasks.store), [])
      ready = true
      pending = undefined
    }
    const crossing = Promise.withResolvers<{ drained: number; remaining: number }>()
    pending = crossing.promise
    const crossingPass = scheduledPass()
    ready = false
    SessionCoordinator.clear()
    ready = true
    crossing.resolve({ drained: 0, remaining: 2 })
    await crossingPass
    assertEquals(BackgroundTasks.store['attachment-delivery'].remaining?.count, 2)
    pending = undefined
    ready = false
    SessionCoordinator.clear()
    const beforeLogout = calls
    await scheduledPass()
    assertEquals(calls, beforeLogout)
    ready = true
    await DocumentDrain.start()
    assertEquals(calls, beforeLogout)
    const scheduled = delays.length
    failure = new TypeError('Programming error')
    await assertRejects(() => scheduledPass(), TypeError, 'Programming error')
    assertEquals(delays.length, scheduled)
    assertEquals(BackgroundTasks.store['attachment-delivery'].error, 'Programming error')
    lockFailure = new TypeError('Locks unavailable')
    await assertRejects(() => scheduledPass(), TypeError, 'Locks unavailable')
    assertEquals(delays.length, scheduled)
  } finally {
    BackgroundTasks.clearAll()
    api.SessionState.isPrepared = prepared
    api.AttachmentsUploads.drain = drain
    api.FieldBinderUploads.drain = binderDrain
    globalThis.setTimeout = timeout
    if (locks) Object.defineProperty(navigator, 'locks', locks)
    else Reflect.deleteProperty(navigator, 'locks')
  }
})
