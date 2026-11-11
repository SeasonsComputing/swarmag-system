/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Storage reset                                                                ║
║ Remove configured root objects through Storage and verify emptiness.         ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { readStorageContract } from './storage-contract.ts'
import { confirmStorageReset, readStorageTarget, storageObjects } from './storage-utils.ts'

const contract = await readStorageContract(Deno.args[1])
const target = await readStorageTarget()
confirmStorageReset(target)
for (const binding of Object.values(contract.stores)) {
  const objects = await storageObjects(target.client, binding.root)
  for (let offset = 0; offset < objects.length; offset += 100) {
    const { error } = await target.client.storage.from(binding.root).remove(
      objects.slice(offset, offset + 100).map(object => object.name)
    )
    if (error) throw error
  }
  if ((await storageObjects(target.client, binding.root)).length !== 0) {
    throw new Error(`Storage reset verification failed: ${binding.root}`)
  }
  console.log(`STORAGE_RESET_PASS=${binding.root}`)
}
