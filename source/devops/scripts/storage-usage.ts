/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Storage usage                                                                ║
║ Report every bucket's object bytes against the free-tier storage allowance. ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { readStorageTarget, storageObjects } from './storage-utils.ts'

const target = await readStorageTarget()
let total = 0
for (let offset = 0;; offset += 100) {
  const { data, error } = await target.client.storage.listBuckets({ limit: 100, offset })
  if (error) throw error
  for (const bucket of data) {
    const objects = await storageObjects(target.client, bucket.id)
    const bytes = objects.reduce((sum, object) => sum + object.size, 0)
    total += bytes
    console.log(`${bucket.name}: ${bytes} bytes (${objects.length} objects)`)
  }
  if (data.length < 100) break
}
console.log(`STORAGE_USAGE_BYTES=${total} FREE_TIER_BYTES=1000000000`)
