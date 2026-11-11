/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Stage test configuration                                                     ║
║ Register stage credentials and require nonpersistent public API sessions.    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides the authenticated test driver's configuration entry point. Registers
the service-role environment variable under the logical service-key name used
by edge functions, while keeping shared database-free test bootstrap unchanged.
Rejects any client mode other than edge before the public client is created.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Config       Initialized runtime configuration singleton.
├ init(...)  Initialize configuration once; already invoked by this module.
├ get(name)  Read a registered configuration value.
└ fail(msg)  Terminate on a configuration invariant failure.
*/

import { Config } from '@core/cfg/config.ts'
import { DenoProvider } from '@core/cfg/deno-provider.ts'
import { readStorageContract, storageBuildRoot } from '@devops/scripts/storage-contract.ts'

const Provider = new DenoProvider()
const root = storageBuildRoot(
  await readStorageContract('stage'),
  Provider.get('ATTACHMENTS_SERVER_ROOT')
)
Config.init({
  get: name => name === 'ATTACHMENTS_SERVER_ROOT' ? root : Provider.get(name),
  fail: message => Provider.fail(message)
}, [
  'SUPABASE_RDBMS_URL',
  'SUPABASE_PUBLIC_KEY',
  'SUPABASE_CLIENT_MODE',
  'DOCUMENT_INBOX_DB_NAME',
  'ATTACHMENTS_SERVER_ROOT',
  'LOCAL_DB_NAME',
  'SUPABASE_SERVICE_ROLE_KEY'
], {
  SUPABASE_SERVICE_KEY: 'SUPABASE_SERVICE_ROLE_KEY'
})

if (Config.get('SUPABASE_CLIENT_MODE') !== 'edge') {
  Config.fail('Stage tests require SUPABASE_CLIENT_MODE=edge')
}

export { Config }
