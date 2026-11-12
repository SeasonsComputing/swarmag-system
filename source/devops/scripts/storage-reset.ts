/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Storage reset                                                                ║
║ Leave the target's Storage holding only its contract's roots, empty.         ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { StringSet } from '@core/std'
import { readStorageContract } from './storage-contract.ts'
import { confirmStorageReset, readStorageTarget, storageObjects } from './storage-utils.ts'

const contract = await readStorageContract(Deno.args[1])
const target = await readStorageTarget()
confirmStorageReset(target)

/** Remove every object in a native bucket, then verify it is empty. */
const empty = async (root: string): Promise<void> => {
  const objects = await storageObjects(target.client, root)
  for (let offset = 0; offset < objects.length; offset += 100) {
    const { error } = await target.client.storage.from(root).remove(
      objects.slice(offset, offset + 100).map(object => object.name)
    )
    if (error) throw error
  }
  if ((await storageObjects(target.client, root)).length !== 0) {
    throw new Error(`Storage reset verification failed: ${root}`)
  }
}

const roots = new StringSet(Object.values(contract.stores).map(binding => binding.root))
for (const root of roots) {
  await empty(root)
  console.log(`STORAGE_RESET_PASS=${root}`)
}

// A native bucket the contract does not name is left from an earlier layout: nothing survives.
const strays: string[] = []
for (let offset = 0;; offset += 100) {
  const { data, error } = await target.client.storage.listBuckets({ limit: 100, offset })
  if (error) throw error
  strays.push(...data.map(bucket => bucket.id).filter(id => !roots.has(id)))
  if (data.length < 100) break
}
for (const stray of strays) {
  await empty(stray)
  const { error } = await target.client.storage.deleteBucket(stray)
  if (error) throw error
  console.log(`STORAGE_RESET_REMOVED=${stray}`)
}
