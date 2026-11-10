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

Deno.test('DocumentDrain backs off only drain failures and surfaces lock and programming errors', async () => {
  const Values: StringDictionary = {
    SUPABASE_RDBMS_URL: 'http://drain.test',
    SUPABASE_PUBLIC_KEY: 'drain-public-key',
    SUPABASE_CLIENT_MODE: 'edge',
    DOCUMENT_INBOX_DB_NAME: 'drain-test-inbox',
    DOCUMENT_SERVER_DB_NAME: 'drain-test-server',
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
  const drain = api.Attachments.drain
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
  globalThis.setTimeout = ((_callback: TimerHandler, delay?: number) => {
    delays.push(delay!)
    return 1
  }) as typeof setTimeout
  api.Attachments.drain = () => {
    calls++
    if (failure) return Promise.reject(failure)
    return Promise.resolve({ drained: 0, remaining: 0 })
  }
  try {
    await DocumentDrain.start()
    assertEquals(delays, [60_000])
    failure = new AggregateError([new ApiError('Upload failed', 503)])
    await DocumentDrain.start()
    failure = new ApiError('List failed', 503)
    await DocumentDrain.start()
    await DocumentDrain.start()
    await DocumentDrain.start()
    await DocumentDrain.start()
    assertEquals(delays, [60_000, 120_000, 240_000, 480_000, 900_000, 900_000])
    available = false
    const beforeSkip = calls
    await DocumentDrain.start()
    assertEquals(calls, beforeSkip)
    assertEquals(delays.at(-1), 900_000)
    available = true
    failure = undefined
    await DocumentDrain.start()
    assertEquals(delays.at(-1), 60_000)
    const scheduled = delays.length
    failure = new TypeError('Programming error')
    await assertRejects(() => DocumentDrain.start(), TypeError, 'Programming error')
    assertEquals(delays.length, scheduled)
    lockFailure = new TypeError('Locks unavailable')
    await assertRejects(() => DocumentDrain.start(), TypeError, 'Locks unavailable')
    assertEquals(delays.length, scheduled)
  } finally {
    api.Attachments.drain = drain
    globalThis.setTimeout = timeout
    if (locks) Object.defineProperty(navigator, 'locks', locks)
    else Reflect.deleteProperty(navigator, 'locks')
  }
})
