/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Upload task                                                                  ║
║ One chosen document: stage it with progress, then place it after Save.       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
The upload task both upload consumers share (attachments and the Field Binder).
Choosing a document mints its id and publishes a background task keyed by it.
The task reads the document, reporting bytes, and stages it once under that id.
It places the staged document only when its consumer releases it after a
successful Save; placing is the handoff to the pair's drain. A stage or
placement failure publishes a failed report naming the document. The task holds
exit responsibility until it places, fails, or is abandoned.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UploadRead       Read a chosen document, reporting bytes read against the total.
UploadTask       One chosen document's upload.
├ constructor    Mint the id, publish the task, and start staging.
├ id             The minted document id.
├ name           The document's name.
├ staged         The staged document, or undefined when staging failed.
├ place          After Save: place into the consumer's bucket, then clear.
├ abandon        End without placing, discarding staging when asked.
└ fromFile       A read of a local File.
*/

import type { Uploads } from '@core/cli/docstore-uploads.ts'
import { id } from '@core/std'
import type { Id } from '@core/std'
import type { BucketId, DocumentId, NodeMetadata } from '@core/stdx'
import { BackgroundTasks } from '@ux/shell/runtime/background-tasks.ts'

/** Read a chosen document, reporting bytes read against the total; an interrupted read rejects. */
export type UploadRead = (report: (completed: number, total: number) => void) => Promise<File>

/** One chosen document's upload: stage with progress, then place once released after Save. */
export class UploadTask {
  readonly id: Id
  readonly name: string
  readonly staged: Promise<NodeMetadata<DocumentId> | undefined>
  readonly #uploads: Uploads
  readonly #key: string
  #ended = false
  #percent = -1

  /** Mint the document id, publish the task, and start staging the read document. */
  constructor(uploads: Uploads, name: string, read: UploadRead) {
    this.#uploads = uploads
    this.id = id()
    this.name = name
    this.#key = `upload:${this.id}`
    this.#publish(0, 0)
    this.staged = this.#stage(read)
  }

  /** A read of a local File through its stream; the bytes are assembled, never chunked to storage. */
  static fromFile(file: File): UploadRead {
    return async report => {
      const reader = file.stream().getReader()
      // Each chunk is copied into its own ArrayBuffer, which a File part requires.
      const chunks: Uint8Array<ArrayBuffer>[] = []
      let completed = 0
      report(completed, file.size)
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value.slice())
        completed += value.byteLength
        report(completed, file.size)
      }
      return new File(chunks, file.name, { type: file.type, lastModified: file.lastModified })
    }
  }

  /**
   * Place the staged document after its consumer's Save, then clear the task. A failed stage was
   * already reported, so there is nothing to place.
   * @param into Create or find the destination bucket.
   */
  async place(into: () => Promise<BucketId>): Promise<void> {
    const staged = await this.staged
    if (staged === undefined || this.#ended) return
    try {
      await this.#uploads.place(staged.id, await into())
      this.#end()
    } catch (error) {
      this.#fail(error)
    }
  }

  /**
   * End the task at once without placing, even while its read is running. The read is not
   * aborted; the staged copy is discarded when staging completes.
   * @param discard Remove the staged copy; only when no write can reference it.
   */
  async abandon(discard: boolean): Promise<void> {
    if (this.#ended) return
    this.#end()
    const staged = await this.staged
    if (discard && staged !== undefined) await this.#uploads.discard([staged.id])
  }

  /** Read with progress, then stage once under the minted id. */
  async #stage(read: UploadRead): Promise<NodeMetadata<DocumentId> | undefined> {
    try {
      const file = await read((completed, total) => this.#publish(completed, total))
      return await this.#uploads.stage(file, { id: this.id })
    } catch (error) {
      this.#fail(error)
      return undefined
    }
  }

  /** Report bytes read, publishing only when the whole percent changes. */
  #publish(completed: number, total: number): void {
    if (this.#ended) return
    const known = Math.max(total, completed)
    const percent = known === 0 ? 0 : Math.floor(completed * 100 / known)
    if (percent === this.#percent) return
    this.#percent = percent
    BackgroundTasks.publish(this.#key, {
      label: `Upload ${this.name}`,
      phase: 'running',
      blocksExit: true,
      progress: { completed, total: known, unit: 'bytes' }
    })
  }

  /** Publish the failure, naming the document, and release exit responsibility. */
  #fail(error: unknown): void {
    if (this.#ended) return
    this.#ended = true
    const detail = error instanceof Error && error.message.trim() ? error.message : 'Upload failed.'
    BackgroundTasks.publish(this.#key, {
      label: `Upload ${this.name}`,
      phase: 'failed',
      blocksExit: false,
      error: `${this.name}: ${detail}`
    })
  }

  /** Clear the task once it has placed or been abandoned. */
  #end(): void {
    this.#ended = true
    BackgroundTasks.clear(this.#key)
  }
}
