/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Local Field Binder                                                           ║
║ Complete local snapshots committed by reserved device status metadata.       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Reads only the injected local mirror. Explicit Sync captures one source
publication, copies and verifies the files already delivered to the server,
then creates .status.json as the commit point. An entry whose document has not
arrived is skipped; the reader lists and verifies only the entries it holds, and
a snapshot that skipped one reports an update available, after a reload too.
A renamed source document is renamed locally at the next Sync. Failed
preparation retains the previous complete snapshot. A shared origin Web Lock
serializes preparation against local load/open; duplicate invocation on one
instance shares the pending pass. Source changes are checked once after
copying, never chased in an unbounded loop.
Cleanup follows retained status -> inventory -> document references. Extra
bytes or cleanup warnings do not invalidate a confirmed complete snapshot.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FieldBinderProgress  One bounded preparation's document counts.
├ completed          Verified documents.
└ total              Captured document count.
FieldBinderSnapshot  Read-only reader/preparation state.
├ entries            Last complete local membership: the entries it holds.
├ loading            Local validation is pending.
├ syncing            Explicit preparation is pending.
├ available          A complete local snapshot exists.
├ syncedAt           Successful local copy time.
├ verifiedAt         Source currency was checked at this time.
├ updateAvailable    The source differs, or the snapshot skipped an entry.
├ error              Last load/preparation failure copy.
└ cleanupError       Cleanup failure after a confirmed commit.
FieldBinder          Local access and explicit complete preparation.
├ constructor        Bind local mirror, remote source store, and source service.
├ store              Reactive read-only preparation/reader snapshot.
├ start              Begin the local load for the application root's lifetime.
├ load               Validate the newest complete local status and files.
├ sync               Prepare one captured source snapshot, reporting progress.
├ link               Mint a link from verified local bytes only.
└ status             Reactive user-facing availability/verification copy.
*/

import { StringSet, ValidatorError, when } from '@core/std'
import type { When } from '@core/std'
import { ApiError } from '@core/stdx'
import type {
  ApiDocumentStoreContract,
  BucketId,
  DocumentId,
  DocumentLink,
  NodeMetadata
} from '@core/stdx'
import { createStore } from '@solid-js/store'
import { FieldBinderMetadata } from './field-binder-inventory.ts'
import type {
  FieldBinderEntry,
  FieldBinderPublication,
  FieldBinderStatus
} from './field-binder-inventory.ts'
import type { FieldBinderSource } from './field-binder-source.ts'

/** Known bounded preparation counts, independent of upload draining. */
export type FieldBinderProgress = { completed: number; total: number }

/** Local reader state; only this service publishes mutations. */
export type FieldBinderSnapshot = {
  readonly entries: readonly FieldBinderEntry[]
  readonly loading: boolean
  readonly syncing: boolean
  readonly available: boolean
  readonly syncedAt?: When
  readonly verifiedAt?: When
  readonly updateAvailable: boolean
  readonly error?: string
  readonly cleanupError?: string
}

/** Device-local collection with explicit, serialized preparation. */
export class FieldBinder {
  readonly #local: ApiDocumentStoreContract
  readonly #server: ApiDocumentStoreContract
  readonly #source: FieldBinderSource
  readonly #state = createStore<FieldBinderSnapshot>({
    entries: [],
    loading: false,
    syncing: false,
    available: false,
    updateAvailable: false
  })
  #loading: Promise<void> | undefined
  #syncing: Promise<void> | undefined

  constructor(
    local: ApiDocumentStoreContract,
    server: ApiDocumentStoreContract,
    source: FieldBinderSource
  ) {
    this.#local = local
    this.#server = server
    this.#source = source
  }

  get store(): FieldBinderSnapshot {
    return this.#state[0]
  }

  /** Begin the local load for the application root's lifetime; a failure surfaces unhandled. */
  readonly start = (): void => {
    void this.load().catch(error => {
      queueMicrotask(() => {
        throw error
      })
    })
  }

  /** Local loading owns expected error state; programming errors still reject. */
  load(): Promise<void> {
    if (this.#loading) return this.#loading
    this.#loading = this.#load().finally(() => {
      this.#loading = undefined
    })
    return this.#loading
  }

  /** One instance shares an invocation; separate tabs serialize through the origin lock. */
  sync(progress?: (value: FieldBinderProgress) => void): Promise<void> {
    if (this.#syncing) return this.#syncing
    this.#syncing = this.#prepare(progress).finally(() => {
      this.#syncing = undefined
    })
    return this.#syncing
  }

  /** Revalidate the selected snapshot under a read lock; never fall back to the server. */
  async link(entry: FieldBinderEntry): Promise<DocumentLink> {
    return await navigator.locks.request(PREPARATION_LOCK, { mode: 'shared' }, async () => {
      const snapshot = await this.#snapshot()
      if (!snapshot) throw new ApiError('The Field Binder is not downloaded.', 404)
      this.#adopt(snapshot)
      const current = snapshot.held.find(item => item.id === entry.id)
      if (!current || current.documentAddress !== entry.documentAddress) {
        throw new ApiError(
          'This local Binder entry changed. Select it again from the current collection.',
          409
        )
      }
      return await this.#local.document.link(FieldBinderMetadata.id(current.documentAddress))
    })
  }

  /** Reloaded state claims offline availability, not unobserved source currency. */
  status(): string {
    const state = this.store
    if (state.syncing) return 'Syncing Field Binder…'
    if (state.error) {
      return state.available
        ? 'Available offline · Last sync failed'
        : 'Not downloaded · Last sync failed'
    }
    if (!state.available) return 'Not downloaded'
    if (state.updateAvailable) return 'Available offline · Update available'
    if (state.verifiedAt) return `Verified current at ${new Date(state.verifiedAt).toLocaleString()}`
    return `Available offline · Last copied ${new Date(state.syncedAt!).toLocaleString()}`
  }

  async #load(): Promise<void> {
    this.#state[1]({ loading: true, error: undefined })
    try {
      await navigator.locks.request(PREPARATION_LOCK, { mode: 'shared' }, async () => {
        const snapshot = await this.#snapshot()
        if (snapshot) this.#adopt(snapshot)
        else {this.#state[1]({
            entries: [],
            available: false,
            syncedAt: undefined,
            verifiedAt: undefined
          })}
      })
    } catch (error) {
      this.#state[1]({ entries: [], available: false, error: errorCopy(error), verifiedAt: undefined })
      if (!(error instanceof ApiError) && !(error instanceof ValidatorError)) throw error
    } finally {
      this.#state[1]({ loading: false })
    }
  }

  async #prepare(progress?: (value: FieldBinderProgress) => void): Promise<void> {
    this.#state[1]({ syncing: true, error: undefined, cleanupError: undefined, verifiedAt: undefined })
    try {
      await navigator.locks.request(PREPARATION_LOCK, async () => {
        const publication = await this.#source.publication()
        if (!publication) {
          throw new ApiError('The source has no published Field Binder to download.', 404)
        }
        const namespace = await this.#local.namespace.create(
          FieldBinderMetadata.catalog.namespace.name,
          FieldBinderMetadata.catalog.namespace.id
        )
        const bucket = await this.#local.bucket.create(
          namespace.id,
          FieldBinderMetadata.catalog.bucket.name,
          FieldBinderMetadata.catalog.bucket.id
        )
        const references = [
          ...new StringSet(publication.inventory.entries.map(entry => entry.documentAddress))
        ]
        let completed = 0
        progress?.({ completed, total: references.length })
        let skipped = 0
        for (const reference of references) {
          const document = FieldBinderMetadata.id(reference)
          const metadata = await this.#delivered(document)
          if (metadata === undefined) {
            // Not delivered yet: skipped, so this snapshot is not current.
            skipped++
            progress?.({ completed: ++completed, total: references.length })
            continue
          }
          if (metadata.name.startsWith('.')) {
            throw new ApiError('A published Binder entry references reserved metadata.', 409)
          }
          const body = await this.#server.document.read(document)
          if (body.size !== metadata.count) {
            throw new ApiError('A source Binder file is incomplete.', 409)
          }
          const local = await this.#local.document.create(
            bucket.id,
            metadata.name,
            body,
            document.document
          )
          // A copy already held keeps its old name; a renamed source renames it here.
          if (local.name !== metadata.name) await this.#local.document.update(document, metadata.name)
          const copied = await this.#local.document.get(document)
          if (copied.count !== metadata.count) {
            throw new ApiError('A copied Binder file has the wrong size.', 409)
          }
          await this.#verifyLocal(document)
          completed++
          progress?.({ completed, total: references.length })
        }
        await this.#local.document.create(
          bucket.id,
          FieldBinderMetadata.catalog.inventoryName,
          publication.body,
          publication.document.id.document
        )
        // The copied inventory and its files are verified before the commit point.
        await this.#readInventory(publication.document.id)
        const status: FieldBinderStatus = {
          schemaVersion: 1,
          inventoryAddress: FieldBinderMetadata.address(publication.document.id),
          sourcePublication: FieldBinderMetadata.address(publication.document.id),
          syncedAt: when()
        }
        const statusDocument = await this.#local.document.create(
          bucket.id,
          FieldBinderMetadata.catalog.statusName,
          new Blob([JSON.stringify(status)], { type: 'application/json' })
        )
        // A confirmed status selects a complete snapshot. Cleanup cannot undo it.
        const snapshot = await this.#snapshot()
        if (!snapshot) throw new ApiError('The prepared Binder status could not be read back.', 409)
        this.#adopt(snapshot)
        try {
          await this.#cleanup(bucket.id, statusDocument)
        } catch (error) {
          this.#state[1]({ cleanupError: `Binder prepared; cleanup failed: ${errorCopy(error)}` })
        }
        const latest = await this.#source.publication()
        const current = skipped === 0 && latest !== undefined
          && FieldBinderMetadata.address(latest.document.id) === snapshot.status.sourcePublication
        this.#state[1]({ updateAvailable: !current, verifiedAt: current ? when() : undefined })
      })
    } catch (error) {
      this.#state[1]({ error: errorCopy(error) })
      throw error
    } finally {
      this.#state[1]({ syncing: false })
    }
  }

  async #snapshot(): Promise<PreparedSnapshot | undefined> {
    let bucket: NodeMetadata<BucketId>
    try {
      bucket = await this.#local.bucket.resolve(FieldBinderMetadata.collection())
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return undefined
      throw error
    }
    const candidates = [
      ...await this.#local.document.find(bucket.id, FieldBinderMetadata.catalog.statusName)
    ]
      .sort(FieldBinderMetadata.compare).reverse()
    let failure: unknown
    for (const document of candidates) {
      try {
        const status = FieldBinderMetadata.readStatus(FieldBinderMetadata.readJson(
          await (await this.#local.document.read(document.id)).text(),
          'status'
        ))
        const prepared = await this.#readInventory(FieldBinderMetadata.id(status.inventoryAddress))
        return { status, ...prepared }
      } catch (error) {
        if (!(error instanceof ApiError) && !(error instanceof ValidatorError)) throw error
        failure ??= error
      }
    }
    if (failure) throw failure
    return undefined
  }

  /** Read a local inventory and verify the entries it holds; an absent document was skipped. */
  async #readInventory(
    document: DocumentId
  ): Promise<{ publication: FieldBinderPublication; held: readonly FieldBinderEntry[] }> {
    const metadata = await this.#local.document.get(document)
    if (metadata.name !== FieldBinderMetadata.catalog.inventoryName) {
      throw new ApiError('The prepared Binder status does not select an inventory.', 409)
    }
    const body = await this.#local.document.read(document)
    const inventory = FieldBinderMetadata.readInventory(
      FieldBinderMetadata.readJson(await body.text(), 'inventory')
    )
    const held: FieldBinderEntry[] = []
    for (const entry of inventory.entries) {
      try {
        await this.#verifyLocal(FieldBinderMetadata.id(entry.documentAddress))
        held.push(entry)
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 404) throw error
      }
    }
    return { publication: { document: metadata, body, inventory }, held }
  }

  /** The server's metadata for a delivered document; undefined while it has not arrived. */
  async #delivered(document: DocumentId): Promise<NodeMetadata<DocumentId> | undefined> {
    try {
      return await this.#server.document.get(document)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return undefined
      throw error
    }
  }

  async #verifyLocal(document: DocumentId): Promise<void> {
    const metadata = await this.#local.document.get(document)
    if (metadata.name.startsWith('.')) {
      throw new ApiError('A Binder entry references reserved metadata.', 409)
    }
    const body = await this.#local.document.read(document)
    if (body.size !== metadata.count) throw new ApiError('A prepared Binder file is incomplete.', 409)
  }

  #adopt(snapshot: PreparedSnapshot): void {
    const unchanged = this.store.syncedAt === snapshot.status.syncedAt
    const skipped = snapshot.held.length < snapshot.publication.inventory.entries.length
    this.#state[1]({
      entries: [...snapshot.held],
      available: true,
      syncedAt: snapshot.status.syncedAt,
      ...(unchanged ? {} : { verifiedAt: undefined, updateAvailable: skipped })
    })
  }

  async #cleanup(bucket: BucketId, committed: NodeMetadata<DocumentId>): Promise<void> {
    const statuses = await this.#local.document.find(bucket, FieldBinderMetadata.catalog.statusName)
    for (const document of statuses) {
      if (FieldBinderMetadata.compare(document, committed) < 0) {
        await this.#local.document.delete(document.id)
      }
    }
    const inventories = new StringSet()
    for (
      const document of await this.#local.document.find(
        bucket,
        FieldBinderMetadata.catalog.statusName
      )
    ) {
      const status = FieldBinderMetadata.readStatus(FieldBinderMetadata.readJson(
        await (await this.#local.document.read(document.id)).text(),
        'status'
      ))
      inventories.add(status.inventoryAddress)
    }
    for (
      const document of await this.#local.document.find(
        bucket,
        FieldBinderMetadata.catalog.inventoryName
      )
    ) {
      if (!inventories.has(FieldBinderMetadata.address(document.id))) {
        await this.#local.document.delete(document.id)
      }
    }
    const files = new StringSet()
    for (
      const document of await this.#local.document.find(
        bucket,
        FieldBinderMetadata.catalog.inventoryName
      )
    ) {
      const inventory = FieldBinderMetadata.readInventory(FieldBinderMetadata.readJson(
        await (await this.#local.document.read(document.id)).text(),
        'inventory'
      ))
      for (const entry of inventory.entries) files.add(entry.documentAddress)
    }
    for (const document of await this.#local.document.list(bucket)) {
      if (!document.name.startsWith('.') && !files.has(FieldBinderMetadata.address(document.id))) {
        await this.#local.document.delete(document.id)
      }
    }
  }
}

const PREPARATION_LOCK = 'field-binder-preparation'

/** A selected snapshot: its status, its inventory, and the entries whose documents it holds. */
type PreparedSnapshot = {
  status: FieldBinderStatus
  publication: FieldBinderPublication
  held: readonly FieldBinderEntry[]
}

const errorCopy = (error: unknown): string => error instanceof Error ? error.message : String(error)
