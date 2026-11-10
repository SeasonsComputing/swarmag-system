/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Storage reset                                                                ║
║ Remove provisioned namespace objects through Storage and verify emptiness.  ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { Attachments } from '@front/api/attachments.ts'
import { confirmStorageReset, readStorageTarget, storageObjects } from './storage-utils.ts'

const target = await readStorageTarget()
confirmStorageReset(target)
for (const namespace of Attachments.namespaces) {
  const objects = await storageObjects(target.client, namespace.id)
  for (let offset = 0; offset < objects.length; offset += 100) {
    const { error } = await target.client.storage.from(namespace.id).remove(
      objects.slice(offset, offset + 100).map(object => object.name)
    )
    if (error) throw error
  }
  if ((await storageObjects(target.client, namespace.id)).length !== 0) {
    throw new Error(`Storage reset verification failed: ${namespace.name}`)
  }
  console.log(`STORAGE_RESET_PASS=${namespace.name}`)
}
