/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Background task reporting tests                                              ║
║ Focused contract and lifecycle verification.                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { ValidatorError } from '@core/std'
import { assertEquals, assertThrows } from '@std/assert'
import { BackgroundTasks } from '@ux/shell/runtime/background-tasks.ts'
import type { BackgroundTask } from '@ux/shell/runtime/background-tasks.ts'

Deno.test('Task publication replaces reports, copies counts, and clears explicitly', () => {
  BackgroundTasks.clearAll()
  const remaining = { count: 3, unit: 'documents' }
  BackgroundTasks.publish('delivery', {
    label: 'Delivery',
    phase: 'waiting',
    blocksExit: true,
    remaining
  })
  remaining.count = 99
  assertEquals(BackgroundTasks.store.delivery.remaining?.count, 3)
  BackgroundTasks.publish('delivery', { label: 'Delivery', phase: 'running', blocksExit: true })
  assertEquals(BackgroundTasks.store.delivery.remaining, undefined)
  BackgroundTasks.publish('delivery', {
    label: 'Delivery',
    phase: 'failed',
    blocksExit: true,
    error: 'Offline'
  })
  BackgroundTasks.publish('delivery', {
    label: 'Delivery',
    phase: 'running',
    blocksExit: true,
    remaining: { count: 0, unit: 'documents' }
  })
  assertEquals(BackgroundTasks.store.delivery.error, undefined)
  assertEquals(Object.keys(BackgroundTasks.store), ['delivery'])
  BackgroundTasks.publish('prepare', {
    label: 'Preparation',
    phase: 'running',
    blocksExit: false,
    progress: { completed: 1, total: 5, unit: 'pages' }
  })
  BackgroundTasks.clear('delivery')
  assertEquals(Object.keys(BackgroundTasks.store), ['prepare'])
  BackgroundTasks.clear('missing')
  BackgroundTasks.clearAll()
  assertEquals(Object.keys(BackgroundTasks.store), [])
})

Deno.test('Task boundary rejects invalid phase, error, responsibility, and counts atomically', () => {
  const report: BackgroundTask = { label: 'Work', phase: 'running', blocksExit: false }
  const invalid: unknown[] = [
    { ...report, label: '' },
    { ...report, phase: 'done' },
    { ...report, blocksExit: 1 },
    { ...report, phase: 'failed' },
    { ...report, phase: 'failed', error: ' ' },
    { ...report, error: 'Unexpected' },
    ...[-1, 0.5, NaN, Infinity].map(count => ({ ...report, remaining: { count, unit: 'items' } })),
    { ...report, remaining: { count: 0, unit: '' } },
    { ...report, progress: { completed: 2, total: 1, unit: 'pages' } },
    { ...report, progress: { completed: 0, total: -1, unit: 'pages' } },
    { ...report, progress: { completed: 0, total: 1, unit: '' } }
  ]
  BackgroundTasks.clearAll()
  for (const task of invalid) {
    assertThrows(() => BackgroundTasks.publish('work', task as BackgroundTask), ValidatorError)
    assertEquals(Object.keys(BackgroundTasks.store), [])
  }
  assertThrows(() => BackgroundTasks.publish(' ', report), ValidatorError)
  BackgroundTasks.publish('work', {
    ...report,
    progress: { completed: 0, total: 0, unit: 'pages' }
  })
  assertEquals(BackgroundTasks.store.work.progress?.total, 0)
  BackgroundTasks.clearAll()
})
