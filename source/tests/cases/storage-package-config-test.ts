/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Storage build configuration tests                                            ║
║ Verify shared root injection for packaging and direct local serving.         ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { readStorageContract, storageBuildRoot } from '@devops/scripts/storage-contract.ts'
import { assert, assertEquals, assertThrows } from '@std/assert'

Deno.test('builds and local serving validate contract roots', async () => {
  const contract = await readStorageContract('stage')
  const root = contract.stores.attachments.root
  for (const supplied of [undefined, '', root]) assertEquals(storageBuildRoot(contract, supplied), root)
  for (const supplied of ['different-root', '__SECRET__', ' root']) {
    assertThrows(() => storageBuildRoot(contract, supplied))
  }
  for (
    const file of [
      'app-admin-package.sh',
      'app-ops-package.sh',
      'app-customer-package.sh',
      'app-local.sh'
    ]
  ) {
    const script = await Deno.readTextFile(`source/devops/scripts/${file}`)
    const injection = script.indexOf('storage-contract.ts')
    const validation = script.indexOf('REQUIRED_KEYS=()')
    assert(injection >= 0 && injection < validation, `${file} must inject before validation`)
    assert(script.includes('"${TARGET}" "${VITE_ATTACHMENTS_SERVER_ROOT:-}"'))
    assert(script.includes('export VITE_ATTACHMENTS_SERVER_ROOT'))
  }
})
