/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Supabase document provider                                                   ║
║ Storage API nodes beneath a configured native root.                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Maps lineage to marker-backed prefixes and immutable objects within one root.
Names are read through info; all listings paginate. Container deletion has a
race between its empty check and marker removal. No SQL writes Storage metadata.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
SupabaseDocumentProvider      DocumentProviderContract over an injected client.
├ constructor(client, rootKey) Bind a lazy client and the root its key names.
├ get                         Read metadata and count children.
├ find                        Match names within a parent.
├ list                        Read direct children, excluding markers.
├ create                      Return existing nodes or upload without overwrite.
├ update                      Rename a marker or document using same-key copy.
├ delete                      Remove documents or empty containers.
├ read                        Download immutable bytes.
└ link                        Sign for the kernel's fixed expiry.
*/

import { Supabase } from '@core/db/supabase.ts'
import { isDictionary, isId, toId, toWhen, when } from '@core/std'
import type { When } from '@core/std'
import { ApiError } from '@core/stdx'
import type { DocumentProviderContract, Lineage, LineageMetadata } from '@core/stdx'
import type { SupabaseClient } from '@supabase/client'

/** Logical nodes stored beneath one provisioned native Storage root. */
export class SupabaseDocumentProvider implements DocumentProviderContract {
  readonly #client: () => SupabaseClient

  readonly #root: string

  constructor(client: () => SupabaseClient, rootKey: string) {
    this.#client = client
    this.#root = Supabase.storageRoot(rootKey)
  }

  /** Read exact metadata, deriving counts from paginated direct children. */
  async get(node: Lineage): Promise<LineageMetadata> {
    const info = readStorageInfo(
      unwrap(await this.#client().storage.from(this.#root).info(objectKey(node)))
    )
    return {
      lineage: node,
      name: info.metadata.name,
      createdAt: toWhen(info.createdAt),
      count: node.document === undefined
        ? (await this.#entries(node)).filter(entry => isId(entry.name)).length
        : info.size
    }
  }

  /** List all direct children before comparing names. */
  async find(parent: Lineage | null, name: string): Promise<readonly LineageMetadata[]> {
    return (await this.list(parent)).filter(node => node.name === name)
  }

  /** List direct children; folder rows have no name metadata, so read each marker. */
  async list(parent: Lineage | null): Promise<readonly LineageMetadata[]> {
    if (parent !== null) await this.#marker(parent)
    const nodes: LineageMetadata[] = []
    for (const entry of await this.#entries(parent)) {
      if (!isId(entry.name)) continue
      const child = parent === null
        ? { namespace: toId(entry.name) }
        : parent.bucket === undefined
        ? { ...parent, bucket: toId(entry.name) }
        : { ...parent, document: toId(entry.name) }
      nodes.push(await this.get(child))
    }
    return nodes
  }

  /** Preserve existing metadata and bytes, including when another creator wins the upload. */
  async create(node: Lineage, name: string, body?: Blob): Promise<LineageMetadata> {
    if (node.bucket !== undefined) {
      await this.get(
        node.document === undefined
          ? { namespace: node.namespace }
          : { namespace: node.namespace, bucket: node.bucket }
      )
    }
    try {
      return await this.get(node)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) throw error
    }
    const content = node.document === undefined ? new Blob([], { type: 'text/plain' }) : body!
    const result = await this.#client().storage.from(this.#root).upload(objectKey(node), content, {
      contentType: content.type,
      metadata: { name },
      upsert: false
    })
    if (result.error && storageStatus(result.error) !== 409) unwrap(result)
    return await this.get(node)
  }

  /** Rename only the name; same-key copy preserves lineage, bytes, and creation time. */
  async update(node: Lineage, name: string): Promise<LineageMetadata> {
    const before = await this.get(node)
    const info = readStorageInfo(
      unwrap(await this.#client().storage.from(this.#root).info(objectKey(node)))
    )
    const metadata = { ...info.metadata, name }
    const encoded = btoa(
      Array.from(new TextEncoder().encode(JSON.stringify(metadata)), byte => String.fromCharCode(byte))
        .join('')
    )
    const response = await Supabase.storageRequest(this.#client(), 'object/copy', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-upsert': 'true', 'x-metadata': encoded },
      body: JSON.stringify({
        bucketId: this.#root,
        sourceKey: objectKey(node),
        destinationKey: objectKey(node),
        copyMetadata: false
      })
    })
    if (!response.ok) throw new ApiError('Document rename failed', response.status)
    await response.body?.cancel()
    const after = await this.get(node)
    if (after.createdAt !== before.createdAt || after.count !== before.count) {
      throw new ApiError('Storage rename changed immutable metadata', 500)
    }
    return after
  }

  /** Remove documents or empty containers; prefix empty-check and removal are not atomic. */
  async delete(node: Lineage) {
    const metadata = await this.get(node)
    if (
      node.document === undefined && (metadata.count !== 0
        || (await this.#entries(node)).some(entry =>
          entry.name !== (node.bucket === undefined ? '.namespace' : '.bucket')
        ))
    ) {
      throw new ApiError('Only empty document containers can be deleted', 409)
    }
    unwrap(await this.#client().storage.from(this.#root).remove([objectKey(node)]))
    return { id: node.document ?? node.bucket ?? node.namespace, deletedAt: when() }
  }

  /** Download bytes with their stored content type. */
  async read(node: Lineage): Promise<Blob> {
    return unwrap(await this.#client().storage.from(this.#root).download(objectKey(node)))
  }

  /** Floor the remaining lifetime so signing never extends the kernel's expiry. */
  async link(node: Lineage, expiresAt: When): Promise<string> {
    const seconds = Math.floor((Date.parse(expiresAt) - Date.now()) / 1000)
    if (seconds <= 0) throw new ApiError('Document link expired before issuance completed', 410)
    return unwrap(
      await this.#client().storage.from(this.#root).createSignedUrl(
        objectKey(node),
        seconds
      )
    ).signedUrl
  }

  /** Read a marker to verify existence without recursively counting its children. */
  async #marker(node: Lineage): Promise<void> {
    unwrap(await this.#client().storage.from(this.#root).info(objectKey(node)))
  }

  async #entries(node: Lineage | null): Promise<{ name: string }[]> {
    const entries: { name: string }[] = []
    for (let offset = 0;; offset += PAGE_SIZE) {
      const page = unwrap(
        await this.#client().storage.from(this.#root).list(
          node === null ? '' : node.bucket === undefined
            ? node.namespace
            : `${node.namespace}/${node.bucket}`,
          {
            limit: PAGE_SIZE,
            offset,
            sortBy: { column: 'name', order: 'asc' }
          }
        )
      )
      entries.push(...page)
      if (page.length < PAGE_SIZE) return entries
    }
  }
}

const PAGE_SIZE = 100

/** The marker or document's immutable object key. */
const objectKey = (node: Lineage): string =>
  node.bucket === undefined
    ? `${node.namespace}/.namespace`
    : `${node.namespace}/${node.bucket}/${node.document ?? '.bucket'}`

/** Storage may carry its semantic HTTP status in statusCode rather than status. */
const storageStatus = (error: { message: string; status?: number; statusCode?: string }): number => {
  for (const code of [error.statusCode, error.status]) {
    const status = Number(code)
    if (Number.isInteger(status) && status >= 400 && status <= 599) return status
  }
  if (/mime|content.?type/i.test(error.message)) return 415
  if (/maximum.*size|too large|size.*limit/i.test(error.message)) return 413
  if (/already exists|duplicate|not empty|must be empty/i.test(error.message)) return 409
  if (/not found|does not exist/i.test(error.message)) return 404
  return 500
}

/** Convert SDK errors at the provider boundary; never turn authorization failures into absence. */
const unwrap = <T>(result: {
  data: T | null
  error: { message: string; status?: number; statusCode?: string } | null
}): T => {
  if (result.error) throw new ApiError(result.error.message, storageStatus(result.error))
  return result.data!
}

/** Validate the Storage info response at the provider boundary. */
const readStorageInfo = (value: unknown): {
  metadata: { name: string }
  createdAt: string
  size: number
} => {
  if (
    !isDictionary(value) || !isDictionary(value.metadata)
    || typeof value.metadata.name !== 'string' || typeof value.createdAt !== 'string'
    || typeof value.size !== 'number'
  ) {
    throw new ApiError('Invalid Storage object info', 500)
  }
  return {
    metadata: { ...value.metadata, name: value.metadata.name },
    createdAt: value.createdAt,
    size: value.size
  }
}
