/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Background task reports                                                      ║
║ Transient work and failure reporting without execution ownership.            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Reports caller-owned work through stable keys. Counts retain their units;
missing counts are unknown. Owners explicitly clear resolved work and supply
exit responsibility independently of phase. Reports are neither persisted nor
executed here. Publication validates and copies input; readers cannot mutate it.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
BACKGROUND_TASK_PHASES  Validated runtime phases.
BackgroundTaskPhase    Phase of locally observed work.
BackgroundTask         Read-only report with label, phase, exit responsibility,
                       optional remaining/progress counts, and failure copy.
BackgroundTasks        Reactive reporting service.
├ store                Read-only reports keyed by caller-owned strings.
├ publish              Validate and replace one report.
├ clear                Remove one report.
└ clearAll             Remove all reports, including on session clear.
*/

import { isConstEnum, isNonEmptyString, notValid } from '@core/std'
import type { Dictionary } from '@core/std'
import { createStore, reconcile, unwrap } from '@solid-js/store'

/** Phases of reported work. */
export const BACKGROUND_TASK_PHASES = ['running', 'waiting', 'failed'] as const
export type BackgroundTaskPhase = (typeof BACKGROUND_TASK_PHASES)[number]

/** Caller-owned work; missing counts mean unknown, and only failed work has error copy. */
export type BackgroundTask = {
  readonly label: string
  readonly phase: BackgroundTaskPhase
  readonly blocksExit: boolean
  readonly remaining?: { readonly count: number; readonly unit: string }
  readonly progress?: {
    readonly completed: number
    readonly total: number
    readonly unit: string
  }
  readonly error?: string
}

/** The reports, keyed by caller-owned strings; the setter stays private to this module. */
const [taskStore, setTaskStore] = createStore<Dictionary<BackgroundTask>>({})

/** Transient reporting operations; no execution or scheduling callbacks. */
export const BackgroundTasks = {
  /** Task store. */
  get store(): Readonly<Dictionary<BackgroundTask>> {
    return taskStore
  },

  /** Publish a task. */
  publish(key: string, task: BackgroundTask): void {
    readBackgroundTaskString(key, 'Task key')
    readBackgroundTaskString(task.label, 'Task label')
    if (!isConstEnum(task.phase, BACKGROUND_TASK_PHASES)) notValid('Invalid task phase')
    if (typeof task.blocksExit !== 'boolean') notValid('Task blocksExit must be boolean')
    if (task.phase === 'failed') readBackgroundTaskString(task.error, 'Failed task error')
    else if (task.error !== undefined) notValid('Only failed tasks have error copy')
    if (task.remaining !== undefined) {
      readBackgroundTaskCount(task.remaining.count, 'Remaining count')
      readBackgroundTaskString(task.remaining.unit, 'Remaining unit')
    }
    if (task.progress !== undefined) {
      readBackgroundTaskCount(task.progress.completed, 'Completed count')
      readBackgroundTaskCount(task.progress.total, 'Total count')
      readBackgroundTaskString(task.progress.unit, 'Progress unit')
      if (task.progress.completed > task.progress.total) notValid('Completed exceeds total')
    }
    const report: BackgroundTask = {
      label: task.label,
      phase: task.phase,
      blocksExit: task.blocksExit,
      ...(task.remaining === undefined ? {} : { remaining: { ...task.remaining } }),
      ...(task.progress === undefined ? {} : { progress: { ...task.progress } }),
      ...(task.error === undefined ? {} : { error: task.error })
    }
    setTaskStore(reconcile({ ...unwrap(taskStore), [key]: report }))
  },

  /** Clear task. */
  clear(key: string): void {
    readBackgroundTaskString(key, 'Task key')
    const reports = { ...unwrap(taskStore) }
    delete reports[key]
    setTaskStore(reconcile(reports))
  },
  clearAll(): void {
    setTaskStore(reconcile({}))
  }
}

/** Require a non-empty string for a task key or label. */
const readBackgroundTaskString = (value: unknown, field: string): void => {
  if (!isNonEmptyString(value)) notValid(`${field} must be a non-empty string`)
}

/** Require a nonnegative safe integer for a count. */
const readBackgroundTaskCount = (value: number, field: string): void => {
  if (!Number.isSafeInteger(value) || value < 0) notValid(`${field} must be a nonnegative integer`)
}
