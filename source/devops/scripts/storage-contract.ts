/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Storage target contract                                                      ║
║ Validate roots shared by builds, provisioning, and policy materialization.   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Reads repository-owned target configuration without application bootstrap.
The command entry point prints the non-secret attachment root for shell callers.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
StorageBinding             A validated private native root and size restriction.
├ root                     Native bucket id.
├ fileSizeLimit            Positive safe integer byte limit.
└ public                   Always false.
StorageContract            Configured bindings, including required attachments.
└ stores                   Named root bindings.
readStorageContract        Read a selected target's validated contract.
readStorageContractValue   Validate unknown contract input.
storageBuildRoot           Check an optional environment value against the contract.
materializeStoragePolicies Replace named roots with SQL-quoted contract values.
*/

import { isDictionary, StringSet } from '@core/std'
import type { Dictionary } from '@core/std'

/** Private native root and maximum object size. */
export type StorageBinding = { root: string; fileSizeLimit: number; public: false }
/** Configured roots; attachments is required by this production. */
export type StorageContract = { stores: Dictionary<StorageBinding> & { attachments: StorageBinding } }

/** Read only an explicitly selected, provisioned target contract. */
export async function readStorageContract(target: string): Promise<StorageContract> {
  if (!['local', 'dev', 'stage', 'prod'].includes(target)) throw new Error('Invalid storage target')
  const path = new URL(`../../../supabase/storage/${target}.jsonc`, import.meta.url)
  return readStorageContractValue(JSON.parse(await Deno.readTextFile(path)))
}

/** Validate all configured roots before any consumer can mutate hosted state or build. */
export function readStorageContractValue(value: unknown): StorageContract {
  if (!isDictionary(value) || !isDictionary(value.stores)) {
    throw new Error('Storage contract requires stores')
  }
  const stores: Dictionary<StorageBinding> = {}
  const roots = new StringSet()
  for (const [name, entry] of Object.entries(value.stores)) {
    if (
      !['attachments', 'fieldBinder'].includes(name) || !isDictionary(entry)
      || typeof entry.root !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(entry.root)
      || typeof entry.fileSizeLimit !== 'number' || !Number.isSafeInteger(entry.fileSizeLimit)
      || entry.fileSizeLimit <= 0 || entry.public !== false || roots.has(entry.root)
    ) throw new Error(`Invalid storage binding: ${name}`)
    roots.add(entry.root)
    stores[name] = { root: entry.root, fileSizeLimit: entry.fileSizeLimit, public: false }
  }
  if (!stores.attachments) throw new Error('Storage contract requires attachments')
  return { stores: { ...stores, attachments: stores.attachments } }
}

/** Resolve build input without accepting a competing environment-owned value. */
export function storageBuildRoot(contract: StorageContract, supplied?: string): string {
  const root = contract.stores.attachments.root
  if (supplied !== undefined && supplied !== '' && supplied !== root) {
    throw new Error('Attachment root conflicts with the target storage contract')
  }
  return root
}

/** Replace every named policy root with a validated SQL literal; undeclared inputs fail. */
export function materializeStoragePolicies(sql: string, contract: StorageContract): string {
  return sql.replace(/\{\{storage\.([a-zA-Z]+)\.root\}\}/g, (_match, name: string) => {
    const binding = contract.stores[name]
    if (!binding) throw new Error(`Policy references undeclared storage binding: ${name}`)
    return `'${binding.root.replaceAll('\'', '\'\'')}'`
  })
}

if (import.meta.main) {
  const contract = await readStorageContract(Deno.args[0])
  console.log(storageBuildRoot(contract, Deno.args[1]))
}
