/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Admin document drain                                                         ║
║ Single-tab attachment reports with unchanged bounded retry pacing.           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Drains placed inbox documents while Admin is open. Schedules after each pass
settles; a Web Lock excludes other tabs. Only expected drain failures back off.
Unexpected errors are reported and stop the schedule. Reports describe this
device inbox; completion rechecks readiness before publishing. Session clearing
removes reports without stopping the loop. A missed lock releases local exit
responsibility. Counts are unknown during a pass and after aggregate failure.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DocumentDrain  Admin's document upload loop.
└ start        Run the first pass and schedule subsequent passes.
*/

import { ApiError } from '@core/stdx'
import { api } from '@front/api/api.ts'

/** Admin's document upload loop, started once at application mount. */
let started = false
export const DocumentDrain = {
  async start(): Promise<void> {
    if (started) return
    started = true
    await drainDocuments()
  }
}

// ────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ────────────────────────────────────────────────────────────────────────────

/** Stable report identity for this attachment pair. */
const ATTACHMENT_TASK_KEY = 'attachment-delivery'
const ATTACHMENT_TASK_LABEL = 'Attachment delivery'

/** Existing pass interval and capped expected-failure delay. */
const DRAIN_INTERVAL = 60_000
const MAX_DRAIN_DELAY = 15 * DRAIN_INTERVAL

/**
 * Run one lock-protected pass, report local responsibility, and schedule the next.
 * Expected failures back off; unexpected failures are reported and stop the loop.
 */
let drainDelay = DRAIN_INTERVAL
async function drainDocuments(): Promise<void> {
  try {
    await navigator.locks.request('document-drain', { ifAvailable: true }, async lock => {
      if (!lock || !api.SessionState.isPrepared()) {
        api.BackgroundTasks.clear(ATTACHMENT_TASK_KEY)
        return
      }
      api.BackgroundTasks.publish(ATTACHMENT_TASK_KEY, {
        label: ATTACHMENT_TASK_LABEL,
        phase: 'running',
        blocksExit: true
      })
      try {
        const result = await api.AttachmentsUploads.drain()
        drainDelay = DRAIN_INTERVAL
        if (!api.SessionState.isPrepared()) return
        if (result.remaining === 0) api.BackgroundTasks.clear(ATTACHMENT_TASK_KEY)
        else {
          api.BackgroundTasks.publish(ATTACHMENT_TASK_KEY, {
            label: ATTACHMENT_TASK_LABEL,
            phase: 'waiting',
            blocksExit: true,
            remaining: { count: result.remaining, unit: 'documents' }
          })
        }
      } catch (error) {
        if (!(error instanceof AggregateError) && !(error instanceof ApiError)) throw error
        reportFailure(error)
        drainDelay = Math.min(drainDelay * 2, MAX_DRAIN_DELAY)
      }
    })
  } catch (error) {
    reportFailure(error)
    throw error
  }
  setTimeout(() => drainDocuments(), drainDelay)
}

/** Publich failures to tasks. */
const reportFailure = (error: unknown): void => {
  if (!api.SessionState.isPrepared()) return
  api.BackgroundTasks.publish(ATTACHMENT_TASK_KEY, {
    label: ATTACHMENT_TASK_LABEL,
    phase: 'failed',
    blocksExit: true,
    error: error instanceof Error && error.message.trim()
      ? error.message
      : 'Attachment delivery failed. Pending documents remain on this device.'
  })
}
