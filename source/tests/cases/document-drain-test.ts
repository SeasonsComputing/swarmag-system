/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Admin drain scheduling tests                                                 ║
║ Verify lock exclusion, expected-failure pacing, and surfaced errors.         ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { Config } from '@core/cfg/config.ts'
import type { StringDictionary } from '@core/std'
import { ApiError } from '@core/stdx'
import { assertEquals, assertRejects } from '@std/assert'

Deno.test('DocumentDrain backs off expected failures and surfaces unexpected errors', async () => {
  const Values: StringDictionary = {
    SUPABASE_RDBMS_URL: 'http://drain.test',
    SUPABASE_PUBLIC_KEY: 'drain-public-key',
    SUPABASE_CLIENT_MODE: 'edge',
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
  const prepared = api.SessionState.isPrepared
  let ready = false
  api.SessionState.isPrepared = () => ready
  let scheduledPass: (() => Promise<void>) | undefined
  const timeout = globalThis.setTimeout
  const locks = Object.getOwnPropertyDescriptor(navigator, 'locks')
  const delays: number[] = []
  let available = true
  let lockFailure: Error | undefined
  let failure: Error | undefined
  let calls = 0
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: async (
        name: string,
        options: LockOptions,
        callback: (lock: Lock | null) => Promise<void>
      ) => {
        assertEquals(name, 'document-drain')
        assertEquals(options, { ifAvailable: true })
        if (lockFailure) throw lockFailure
        await callback(available ? { name, mode: 'exclusive' } : null)
      }
    }
  })
  globalThis.setTimeout = ((callback: TimerHandler, delay?: number) => {
    scheduledPass = callback as () => Promise<void>
    delays.push(delay!)
    return 1
  }) as typeof setTimeout
  api.AttachmentsUploads.drain = () => {
    calls++
    if (failure) return Promise.reject(failure)
    return Promise.resolve({ drained: 0, remaining: 0 })
  }
  try {
    await DocumentDrain.start()
    assertEquals(calls, 0)
    assertEquals(delays, [60_000])
    ready = true
    await DocumentDrain.start()
    assertEquals(calls, 0)
    await scheduledPass!()
    assertEquals(calls, 1)
    assertEquals(delays, [60_000, 60_000])
    failure = new AggregateError([new ApiError('Upload failed', 503)])
    await scheduledPass!()
    failure = new ApiError('List failed', 503)
    await scheduledPass!()
    await scheduledPass!()
    await scheduledPass!()
    await scheduledPass!()
    assertEquals(delays, [60_000, 60_000, 120_000, 240_000, 480_000, 900_000, 900_000])
    available = false
    const beforeSkip = calls
    await scheduledPass!()
    assertEquals(calls, beforeSkip)
    assertEquals(delays.at(-1), 900_000)
    available = true
    failure = undefined
    await scheduledPass!()
    assertEquals(delays.at(-1), 60_000)
    ready = false
    const beforeLogout = calls
    await scheduledPass!()
    assertEquals(calls, beforeLogout)
    ready = true
    await DocumentDrain.start()
    assertEquals(calls, beforeLogout)
    const scheduled = delays.length
    failure = new TypeError('Programming error')
    await assertRejects(() => scheduledPass!(), TypeError, 'Programming error')
    assertEquals(delays.length, scheduled)
    lockFailure = new TypeError('Locks unavailable')
    await assertRejects(() => scheduledPass!(), TypeError, 'Locks unavailable')
    assertEquals(delays.length, scheduled)
  } finally {
    api.SessionState.isPrepared = prepared
    api.AttachmentsUploads.drain = drain
    globalThis.setTimeout = timeout
    if (locks) Object.defineProperty(navigator, 'locks', locks)
    else Reflect.deleteProperty(navigator, 'locks')
  }
})
