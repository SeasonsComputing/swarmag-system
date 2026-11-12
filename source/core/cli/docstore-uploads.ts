/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Durable uploads                                                              ║
║ Capture, place, access, and deliver documents over one injected store pair.  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Owns durable capture and delivery for one inbox/server pair. Consumers own
format policy, destinations, references, save ordering, and scheduling.
Drain aggregates expected ApiError failures after attempting the remaining
documents; unexpected errors stop the pass and propagate unchanged.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Uploads          Document lifecycle over an injected inbox/server pair.
├ constructor    Bind the inbox and server.
├ stage          Capture the supplied file durably.
├ isStaged       Classify a document identity.
├ discard        Remove staging only.
├ place          Copy staging into a consumer's bucket, retaining its source.
├ drain          Deliver a snapshot, aggregating expected failures.
├ link           Mint a link, falling back only for missing placed documents.
└ get            Read metadata with the same fallback rule.
*/

import { notValid, toId } from '@core/std'
import { ApiError } from '@core/stdx'
import type {
  ApiDocumentStoreContract,
  BucketId,
  DocumentId,
  DocumentLink,
  NamespaceId,
  NodeMetadata
} from '@core/stdx'

/** Stable staging identities, relative to each injected inbox. */
const STAGING = toId('019a6000-0000-7000-8000-000000000001')
const STAGING_BUCKET = toId('019a6000-0000-7000-8000-000000000002')

/** One placed document and its source containers captured for delivery. */
type PendingDocument = {
  namespace: NodeMetadata<NamespaceId>
  bucket: NodeMetadata<BucketId>
  document: NodeMetadata<DocumentId>
}

/** Durable document lifecycle for one inbox/server pair. */
export class Uploads {
  readonly #inbox: ApiDocumentStoreContract
  readonly #server: ApiDocumentStoreContract

  /** Bind stores without selecting destinations or scheduling delivery. */
  constructor(inbox: ApiDocumentStoreContract, server: ApiDocumentStoreContract) {
    this.#inbox = inbox
    this.#server = server
  }

  /** Capture the supplied name, bytes, and content type durably. */
  async stage(file: File): Promise<NodeMetadata<DocumentId>> {
    const namespace = await this.#inbox.namespace.create('Staging', STAGING)
    const bucket = await this.#inbox.bucket.create(namespace.id, 'Staging', STAGING_BUCKET)
    return await this.#inbox.document.create(bucket.id, file.name, file)
  }

  /** Whether an identity belongs to this binding's private staging namespace. */
  isStaged(document: DocumentId): boolean {
    return document.namespace === STAGING
  }

  /** Remove staged documents only; consumers own selection lifetime. */
  async discard(staged: readonly DocumentId[]): Promise<void> {
    for (const document of staged) {
      if (!this.isStaged(document)) notValid('Only staged documents can be discarded.')
      await this.#inbox.document.delete(document)
    }
  }

  /** Copy a staged document under the same UUID, retaining its recovery source. */
  async place(staged: DocumentId, into: BucketId): Promise<NodeMetadata<DocumentId>> {
    if (!this.isStaged(staged)) notValid('Only staged documents can be placed.')
    const document = await this.#inbox.document.get(staged)
    const body = await this.#inbox.document.read(staged)
    return await this.#inbox.document.create(into, document.name, body, staged.document)
  }

  /** Mint a link from the inbox, or the server for a missing placed document. */
  async link(document: DocumentId): Promise<DocumentLink> {
    return await this.#either(document, store => store.document.link(document))
  }

  /** Read metadata from the inbox, or the server for a missing placed document. */
  async get(document: DocumentId): Promise<NodeMetadata<DocumentId>> {
    return await this.#either(document, store => store.document.get(document))
  }

  /**
   * Copy one snapshot of placed documents to the server at the same addresses.
   * Aggregates expected ApiError failures after attempting the remaining documents;
   * unexpected errors stop the pass and propagate unchanged. Successful
   * results count completed documents and a fresh snapshot of those still pending.
   */
  async drain(): Promise<{ drained: number; remaining: number }> {
    const pending = await this.#pending()
    const failures: ApiError[] = []
    let drained = 0
    for (const { namespace, bucket, document } of pending) {
      try {
        await this.#drainOne(namespace, bucket, document)
        drained++
      } catch (error) {
        if (!(error instanceof ApiError)) throw error
        failures.push(error)
      }
    }
    if (failures.length) throw new AggregateError(failures, 'Some documents could not be drained.')
    return { drained, remaining: (await this.#pending()).length }
  }

  /** Try the inbox first; fall back to the server only for a missing, placed document. */
  async #either<T>(
    node: DocumentId,
    operation: (store: ApiDocumentStoreContract) => Promise<T>
  ): Promise<T> {
    try {
      return await operation(this.#inbox)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404 || node.namespace === STAGING) throw error
      return await operation(this.#server)
    }
  }

  /** Snapshot placed inbox documents, excluding Staging and retaining all containers. */
  async #pending(): Promise<readonly PendingDocument[]> {
    const pending = []
    for (const namespace of await this.#inbox.namespace.list()) {
      if (namespace.id.namespace === STAGING) continue
      for (const bucket of await this.#inbox.bucket.list(namespace.id)) {
        for (const document of await this.#inbox.document.list(bucket.id)) {
          pending.push({ namespace, bucket, document })
        }
      }
    }
    return pending
  }

  /** Copy a placed document at its existing address before removing its inbox copy. */
  async #drainOne(
    namespace: NodeMetadata<NamespaceId>,
    bucket: NodeMetadata<BucketId>,
    document: NodeMetadata<DocumentId>
  ): Promise<void> {
    let body: Blob
    try {
      body = await this.#inbox.document.read(document.id)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) throw error
      // Another drain may have removed it since listing; only a server copy proves completion.
      await this.#server.document.get(document.id)
      return
    }
    const targetNamespace = await this.#server.namespace.create(namespace.name, namespace.id.namespace)
    const targetBucket = await this.#server.bucket.create(
      targetNamespace.id,
      bucket.name,
      bucket.id.bucket
    )
    await this.#server.document.create(targetBucket.id, document.name, body, document.id.document)
    try {
      await this.#inbox.document.delete(document.id)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) throw error
      await this.#server.document.get(document.id)
    }
  }
}
