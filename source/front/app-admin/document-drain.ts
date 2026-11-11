/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Admin document drain                                                         ║
║ Silent, single-tab upload passes with bounded retry pacing.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Drains placed inbox documents while Admin is open. Schedules after each pass
settles; a Web Lock excludes other tabs. Only expected drain failures back off.
Unexpected errors surface and stop the schedule.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DocumentDrain  Admin's document upload loop.
└ start        Run the first pass and schedule subsequent passes.
*/

import { ApiError } from '@core/stdx'
import { api } from '@front/api/api.ts'

/** Admin's document upload loop, started once after bootstrap. */
export const DocumentDrain = {
  async start(): Promise<void> {
    if (started) return
    started = true
    await drainDocuments()
  }
}

let started = false

const DRAIN_INTERVAL = 60_000
const MAX_DRAIN_DELAY = 15 * DRAIN_INTERVAL
let drainDelay = DRAIN_INTERVAL

async function drainDocuments(): Promise<void> {
  await navigator.locks.request('document-drain', { ifAvailable: true }, async lock => {
    if (!lock || !api.SessionState.isPrepared()) return
    try {
      await api.AttachmentsUploads.drain()
      drainDelay = DRAIN_INTERVAL
    } catch (error) {
      if (!(error instanceof AggregateError) && !(error instanceof ApiError)) throw error
      drainDelay = Math.min(drainDelay * 2, MAX_DRAIN_DELAY)
    }
  })
  setTimeout(() => drainDocuments(), drainDelay)
}
