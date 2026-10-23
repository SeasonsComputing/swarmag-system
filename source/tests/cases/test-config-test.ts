/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Test runtime configuration tests                                             ║
║ Verify shared configuration bootstraps the composed API without I/O.         ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { DenoProvider } from '@core/cfg/deno-provider.ts'
import type { StringDictionary } from '@core/std'
import { assertEquals } from '@std/assert'

Deno.test('shared test configuration registers the local database before API import', async () => {
  const Values: StringDictionary = {
    SUPABASE_RDBMS_URL: 'http://bootstrap.test',
    SUPABASE_PUBLIC_KEY: 'bootstrap-public-key',
    SUPABASE_CLIENT_MODE: 'edge',
    LOCAL_DB_NAME: 'bootstrap-test'
  }
  const originalGet = DenoProvider.prototype.get
  const originalFetch = globalThis.fetch
  DenoProvider.prototype.get = name => Values[name]
  globalThis.fetch = () => {
    throw new Error('API bootstrap must not make network requests')
  }
  try {
    const { Config } = await import('@tests/config/test-config.ts')
    const { api } = await import('@front/api/api.ts')
    assertEquals(Config.get('LOCAL_DB_NAME'), Values.LOCAL_DB_NAME)
    assertEquals(typeof api.AppState.init, 'function')
    assertEquals(typeof api.Users.create, 'function')
  } finally {
    DenoProvider.prototype.get = originalGet
    globalThis.fetch = originalFetch
  }
})
