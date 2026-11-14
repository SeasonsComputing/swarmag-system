/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder Helm bindings                                                   ║
║ The Binder's Sync command and its status line.                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Supplies what an application binds to offer the Field Binder from its Helm: the
Sync command, which owns its progress and failure reports, and the status line.
An application registers the bindings through makeHelmWidget.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FieldBinderHelm  Helm bindings for the Field Binder.
├ commands       The Sync command and its disabled predicate.
└ status         The Binder's status line.
*/

import { ValidatorError } from '@core/std'
import { ApiError } from '@core/stdx'
import { api } from '@front/api/api.ts'
import type { HelmBindings } from '@ux/widgets/helm-widget-contract.ts'

/** The Sync command's name, which is also its report's key. */
const SYNC_COMMAND = '@sync-field-binder'

/** The Sync report's label. */
const SYNC_LABEL = 'Field Binder Sync'

/** Helm bindings for the Field Binder: the Sync command and the status line. */
export const FieldBinderHelm: HelmBindings = {
  commands: {
    [SYNC_COMMAND]: {
      execute: () => sync(),
      disabled: () => api.FieldBinder.store.syncing || !api.SessionState.isPrepared()
    }
  },
  status: { 'field-binder': () => api.FieldBinder.status() }
}

// ────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ────────────────────────────────────────────────────────────────────────────

/** Sync owns its progress/failure report; Helm invokes existing bindings only. */
const sync = async (): Promise<void> => {
  api.BackgroundTasks.publish(SYNC_COMMAND, {
    label: SYNC_LABEL,
    phase: 'running',
    blocksExit: true
  })
  try {
    await api.FieldBinder.sync(progress => {
      if (!api.SessionState.isPrepared()) return
      api.BackgroundTasks.publish(SYNC_COMMAND, {
        label: SYNC_LABEL,
        phase: 'running',
        blocksExit: true,
        progress: { ...progress, unit: 'documents' }
      })
    })
    if (!api.SessionState.isPrepared()) return
    const error = api.FieldBinder.store.cleanupError
    if (error) {
      api.BackgroundTasks.publish(SYNC_COMMAND, {
        label: SYNC_LABEL,
        phase: 'failed',
        blocksExit: false,
        error
      })
    } else api.BackgroundTasks.clear(SYNC_COMMAND)
  } catch (error) {
    if (api.SessionState.isPrepared()) {
      api.BackgroundTasks.publish(SYNC_COMMAND, {
        label: SYNC_LABEL,
        phase: 'failed',
        blocksExit: false,
        error: error instanceof Error ? error.message : 'Field Binder Sync failed.'
      })
    }
    if (!(error instanceof ApiError) && !(error instanceof ValidatorError)) throw error
  }
}
