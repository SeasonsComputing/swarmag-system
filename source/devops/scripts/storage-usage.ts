/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Storage usage                                                                ║
║ Report configured roots against the storage allowance.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { readStorageTarget, storageObjects } from './storage-utils.ts'

import { readStorageContract } from './storage-contract.ts'

const contract = await readStorageContract(Deno.args[1])
const target = await readStorageTarget()
let total = 0
for (const binding of Object.values(contract.stores)) {
  const objects = await storageObjects(target.client, binding.root)
  const bytes = objects.reduce((sum, object) => sum + object.size, 0)
  total += bytes
  console.log(`${binding.root}: ${bytes} bytes (${objects.length} objects)`)
}
console.log(`STORAGE_USAGE_BYTES=${total} FREE_TIER_BYTES=1000000000`)
