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

Config.init(new DenoProvider(), [
  'SUPABASE_RDBMS_URL',
  'SUPABASE_PUBLIC_KEY',
  'SUPABASE_CLIENT_MODE',
  'LOCAL_DB_NAME'
])

export { Config }
