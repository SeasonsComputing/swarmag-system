/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Storage configuration deployment                                             ║
║ Apply and read back catalog buckets and repository-owned storage settings.   ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { AttachmentFormats } from '@front/api/attachment-formats.ts'
import { readStorageContract } from './storage-contract.ts'
import { readStorageTarget } from './storage-utils.ts'

const contract = await readStorageContract(Deno.args[1])
if (Object.keys(contract.stores).some(name => name !== 'attachments')) {
  throw new Error('No provisioning format policy is supplied for this storage binding')
}
const target = await readStorageTarget()
if (
  target.target === 'prod'
  && prompt('Type \'PROD\' to apply production storage configuration:') !== 'PROD'
) {
  throw new Error('Production confirmation did not match')
}
const allowedMimeTypes = [...new Set([...AttachmentFormats.contentTypes(), 'text/plain'])]
for (const binding of Object.values(contract.stores)) {
  const current = await target.client.storage.getBucket(binding.root)
  if (
    current.error && !['404', 'NoSuchBucket'].includes(String(current.error.statusCode))
    && !/bucket not found/i.test(current.error.message)
  ) {
    throw current.error
  }
  // The provisioning REST body carries distinct id and display name; SDK createBucket equates them.
  const response = await fetch(
    `${target.url}/storage/v1/bucket${current.data ? `/${binding.root}` : ''}`,
    {
      method: current.data ? 'PUT' : 'POST',
      headers: {
        apikey: target.key,
        authorization: `Bearer ${target.key}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        id: binding.root,
        name: binding.root,
        public: binding.public,
        file_size_limit: binding.fileSizeLimit,
        allowed_mime_types: allowedMimeTypes
      })
    }
  )
  if (!response.ok) {
    throw new Error(`Storage provisioning failed for ${binding.root}: ${response.status}`)
  }
  await response.body?.cancel()
  const { data, error } = await target.client.storage.getBucket(binding.root)
  if (error) throw error
  if (
    data.id !== binding.root || data.name !== binding.root || data.public !== binding.public
    || Number(data.file_size_limit) !== binding.fileSizeLimit
    || JSON.stringify([...(data.allowed_mime_types ?? [])].sort())
      !== JSON.stringify([...allowedMimeTypes].sort())
  ) {
    throw new Error(`Storage readback mismatch: ${binding.root}`)
  }
  console.log(`STORAGE_CONFIG_PASS=${binding.root}`)
}
