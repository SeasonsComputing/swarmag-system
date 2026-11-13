/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Admin document drain                                                         ║
║ One single-tab delivery loop per upload pair, with bounded retry pacing.     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Drains placed inbox documents while Admin is open, one loop per upload pair:
attachments and the Field Binder. Each loop has its own Web Lock, which excludes
other tabs, its own task key, and its own pacing; it schedules after each pass
settles. Only expected drain failures back off. Unexpected errors are reported
and stop that loop. Reports describe this device inbox; completion rechecks
readiness before publishing. Session clearing removes reports without stopping
a loop. A missed lock releases local exit responsibility. Counts are unknown
during a pass and after aggregate failure.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DocumentDrain  Admin's document delivery loops.
├ taskKeys     Each loop's report key.
└ start        Run each loop's first pass and schedule the next.
*/

import type { Uploads } from '@core/cli/docstore-uploads.ts'
import { ApiError } from '@core/stdx'
import { api } from '@front/api/api.ts'

/** Admin's document delivery loops, started once at application mount. */
let started = false
export const DocumentDrain = {
  taskKeys: { attachments: 'attachment-delivery', binder: 'field-binder-delivery' },
  async start(): Promise<void> {
    if (started) return
    started = true
    await Promise.all([
      new DrainLoop(api.AttachmentsUploads, {
        lock: 'document-drain',
        key: DocumentDrain.taskKeys.attachments,
        label: 'Attachment delivery'
      }).run(),
      new DrainLoop(api.FieldBinderUploads, {
        lock: 'field-binder-drain',
        key: DocumentDrain.taskKeys.binder,
        label: 'Field Binder delivery'
      }).run()
    ])
  }
}

// ────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ────────────────────────────────────────────────────────────────────────────

/** Existing pass interval and capped expected-failure delay. */
const DRAIN_INTERVAL = 60_000
const MAX_DRAIN_DELAY = 15 * DRAIN_INTERVAL

/** One loop's lock name, report key, and report label. */
type DrainIdentity = { lock: string; key: string; label: string }

/** One pair's delivery loop and its pacing. */
class DrainLoop {
  readonly #uploads: Uploads
  readonly #identity: DrainIdentity
  #delay = DRAIN_INTERVAL

  constructor(uploads: Uploads, identity: DrainIdentity) {
    this.#uploads = uploads
    this.#identity = identity
  }

  /**
   * Run one lock-protected pass, report local responsibility, and schedule the next.
   * Expected failures back off; unexpected failures are reported and stop the loop.
   */
  async run(): Promise<void> {
    const { lock, key, label } = this.#identity
    try {
      await navigator.locks.request(lock, { ifAvailable: true }, async held => {
        if (!held || !api.SessionState.isPrepared()) {
          api.BackgroundTasks.clear(key)
          return
        }
        api.BackgroundTasks.publish(key, { label, phase: 'running', blocksExit: true })
        try {
          const result = await this.#uploads.drain()
          this.#delay = DRAIN_INTERVAL
          if (!api.SessionState.isPrepared()) return
          if (result.remaining === 0) api.BackgroundTasks.clear(key)
          else {
            api.BackgroundTasks.publish(key, {
              label,
              phase: 'waiting',
              blocksExit: true,
              remaining: { count: result.remaining, unit: 'documents' }
            })
          }
        } catch (error) {
          if (!(error instanceof AggregateError) && !(error instanceof ApiError)) throw error
          this.#report(error)
          this.#delay = Math.min(this.#delay * 2, MAX_DRAIN_DELAY)
        }
      })
    } catch (error) {
      this.#report(error)
      throw error
    }
    setTimeout(() => this.run(), this.#delay)
  }

  /** Publish a failure to the loop's task. */
  #report(error: unknown): void {
    if (!api.SessionState.isPrepared()) return
    api.BackgroundTasks.publish(this.#identity.key, {
      label: this.#identity.label,
      phase: 'failed',
      blocksExit: true,
      error: error instanceof Error && error.message.trim()
        ? error.message
        : `${this.#identity.label} failed. Pending documents remain on this device.`
    })
  }
}
