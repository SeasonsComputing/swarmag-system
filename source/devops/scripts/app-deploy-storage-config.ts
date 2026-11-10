/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Storage configuration deployment                                             ║
║ Apply and read back catalog buckets and repository-owned storage settings.  ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { isDictionary } from '@core/std'
import { AttachmentFormats } from '@front/api/attachment-formats.ts'
import { Attachments } from '@front/api/attachments.ts'
import { readStorageTarget } from './storage-utils.ts'

// Contracts contain plain JSON, a valid subset of JSONC; no app configuration is loaded.
const targetName = Deno.args[1]
if (!['local', 'dev', 'stage', 'prod'].includes(targetName)) throw new Error('Invalid storage target')
const contract: unknown = JSON.parse(await Deno.readTextFile(`supabase/storage/${targetName}.jsonc`))
if (
  !isDictionary(contract) || typeof contract.fileSizeLimit !== 'number'
  || !Number.isSafeInteger(contract.fileSizeLimit) || contract.fileSizeLimit <= 0
  || contract.public !== false
) throw new Error('Storage contract requires positive size and private buckets')
const target = await readStorageTarget()
if (
  target.target === 'prod'
  && prompt('Type \'PROD\' to apply production storage configuration:') !== 'PROD'
) {
  throw new Error('Production confirmation did not match')
}
const allowedMimeTypes = [...AttachmentFormats.contentTypes()]
for (const namespace of Attachments.namespaces) {
  const current = await target.client.storage.getBucket(namespace.id)
  if (
    current.error && !['404', 'NoSuchBucket'].includes(String(current.error.statusCode))
    && !/bucket not found/i.test(current.error.message)
  ) {
    throw current.error
  }
  // The provisioning REST body carries distinct id and display name; SDK createBucket equates them.
  const response = await fetch(
    `${target.url}/storage/v1/bucket${current.data ? `/${namespace.id}` : ''}`,
    {
      method: current.data ? 'PUT' : 'POST',
      headers: {
        apikey: target.key,
        authorization: `Bearer ${target.key}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        id: namespace.id,
        name: namespace.name,
        public: contract.public,
        file_size_limit: contract.fileSizeLimit,
        allowed_mime_types: allowedMimeTypes
      })
    }
  )
  if (!response.ok) {
    throw new Error(`Storage provisioning failed for ${namespace.name}: ${response.status}`)
  }
  await response.body?.cancel()
  const { data, error } = await target.client.storage.getBucket(namespace.id)
  if (error) throw error
  if (
    data.id !== namespace.id || data.name !== namespace.name || data.public !== contract.public
    || Number(data.file_size_limit) !== contract.fileSizeLimit
    || JSON.stringify([...(data.allowed_mime_types ?? [])].sort())
      !== JSON.stringify([...allowedMimeTypes].sort())
  ) {
    throw new Error(`Storage readback mismatch: ${namespace.name}`)
  }
  console.log(`STORAGE_CONFIG_PASS=${namespace.name}`)
}
