/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Storage operations support                                                   ║
║ Resolve targets and traverse Storage without application bootstrap.         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Shares target resolution and paginated object traversal among storage tasks.
Credentials stay in memory and never enter command arguments or output.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
StorageTarget       Resolved Storage target and service client.
readStorageTarget   Resolve explicit target using canonical topology.
storageObjects      List every object, including markers, within a namespace.
confirmStorageReset Require target confirmation before removing any bytes.
*/

import { isDictionary } from '@core/std'
import { createClient } from '@supabase/client'
import type { SupabaseClient } from '@supabase/client'

/** A resolved operational target; service credentials never reach application clients. */
export type StorageTarget = { target: string; url: string; key: string; client: SupabaseClient }

/** Resolve the explicit target, failing before any mutation. */
export async function readStorageTarget(): Promise<StorageTarget> {
  if (
    Deno.args.length !== 2 || Deno.args[0] !== '--target'
    || !['local', 'dev', 'stage', 'prod'].includes(Deno.args[1])
  ) {
    throw new Error('Usage: --target {local|dev|stage|prod}')
  }
  const target = Deno.args[1]
  let url: string
  let key: string
  if (target === 'local') {
    const status = await commandJson('supabase', ['status', '--output', 'json'])
    if (
      !isDictionary(status) || typeof status.API_URL !== 'string'
      || typeof status.SERVICE_ROLE_KEY !== 'string'
    ) throw new Error('Invalid local Supabase status')
    url = status.API_URL
    key = status.SERVICE_ROLE_KEY
  } else {
    const topology = await commandJson('deno', [
      'run',
      '--allow-run',
      'source/devops/scripts/list-supabase-targets.ts',
      '--target',
      target
    ])
    if (!isDictionary(topology) || !isDictionary(topology[target])) {
      throw new Error('Invalid Supabase topology')
    }
    const entry = topology[target]
    if (typeof entry.url !== 'string' || typeof entry.projectRef !== 'string') {
      throw new Error('Invalid Supabase target')
    }
    url = entry.url
    const keys = await commandJson('supabase', [
      'projects',
      'api-keys',
      '--project-ref',
      entry.projectRef,
      '--output',
      'json'
    ])
    if (!Array.isArray(keys)) throw new Error('Invalid Supabase API keys response')
    const service: unknown = keys.find(value => isDictionary(value) && value.name === 'service_role')
    if (!isDictionary(service) || typeof service.api_key !== 'string') {
      throw new Error('Target has no service-role key')
    }
    key = service.api_key
  }
  console.log(`STORAGE_TARGET=${target} URL=${url}`)
  return {
    target,
    url,
    key,
    client: createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })
  }
}

/** Traverse prefixes, paging each level; includes markers for reset and usage. */
export async function storageObjects(
  client: SupabaseClient,
  namespace: string,
  prefix = ''
): Promise<{ name: string; size: number }[]> {
  const objects: { name: string; size: number }[] = []
  for (let offset = 0;; offset += 100) {
    const { data, error } = await client.storage.from(namespace).list(prefix, {
      limit: 100,
      offset,
      sortBy: { column: 'name', order: 'asc' }
    })
    if (error) throw error
    for (const entry of data) {
      const name = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.id === null) objects.push(...await storageObjects(client, namespace, name))
      else {
        if (!isDictionary(entry.metadata) || typeof entry.metadata.size !== 'number') {
          throw new Error('Storage object has no byte size')
        }
        objects.push({ name, size: entry.metadata.size })
      }
    }
    if (data.length < 100) return objects
  }
}

/** Confirm target before destructive reset; production needs a second typed confirmation. */
export function confirmStorageReset(target: StorageTarget): void {
  if (
    prompt(`Type '${target.target}' to remove all provisioned documents at ${target.url}:`)
      !== target.target
  ) throw new Error('Storage reset target confirmation did not match')
  if (
    target.target === 'prod' && prompt('Type \'PROD\' to confirm production storage maintenance:')
      !== 'PROD'
  ) throw new Error('Production confirmation did not match')
}

/** Read structured subprocess output without ever printing credential-bearing stdout. */
async function commandJson(command: string, args: string[]): Promise<unknown> {
  const output = await new Deno.Command(command, { args, stdout: 'piped', stderr: 'piped' }).output()
  if (!output.success) throw new Error(`${command} failed; check CLI authentication and target`)
  return JSON.parse(new TextDecoder().decode(output.stdout))
}
