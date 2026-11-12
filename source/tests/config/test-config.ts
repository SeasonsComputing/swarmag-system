/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Test runtime configuration                                                   ║
║ Register Deno environment configuration for shared API tests.                ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Test runtime configuration bootstrap.

Registers Supabase settings and the local database name before API imports.
Configuration comes from the test process environment.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Config       Initialized runtime configuration singleton.
├ init(...)  Initialize configuration once; already invoked by this module.
├ get(name)  Read a registered configuration value.
└ fail(msg)  Terminate on a configuration invariant failure.
*/

import { Config } from '@core/cfg/config.ts'
import { DenoProvider } from '@core/cfg/deno-provider.ts'

const Provider = new DenoProvider()
Config.init({
  get: name =>
    name === 'ATTACHMENTS_SERVER_ROOT'
      ? Provider.get(name) ?? 'offline-attachments'
      : name === 'FIELD_BINDER_SERVER_ROOT'
      ? Provider.get(name) ?? 'offline-binder'
      : Provider.get(name),
  fail: message => Provider.fail(message)
}, [
  'SUPABASE_RDBMS_URL',
  'SUPABASE_PUBLIC_KEY',
  'SUPABASE_CLIENT_MODE',
  'DOCUMENT_INBOX_DB_NAME',
  'ATTACHMENTS_SERVER_ROOT',
  'FIELD_BINDER_SERVER_ROOT',
  'FIELD_BINDER_INBOX_DB_NAME',
  'FIELD_BINDER_DB_NAME',
  'LOCAL_DB_NAME'
])

export { Config }
