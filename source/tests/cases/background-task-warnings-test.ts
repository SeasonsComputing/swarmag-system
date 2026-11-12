/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Background task warning tests                                                ║
║ Focused contract and lifecycle verification.                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { assertEquals } from '@std/assert'
import { BackgroundTaskWarnings } from '@ux/shell/runtime/background-task-warnings.ts'
import { BackgroundTasks } from '@ux/shell/runtime/background-tasks.ts'

Deno.test('Warnings read current responsibility and repeated cleanup removes listeners', () => {
  const add = globalThis.addEventListener
  const remove = globalThis.removeEventListener
  const target = new EventTarget()
  globalThis.addEventListener = target.addEventListener.bind(target)
  globalThis.removeEventListener = target.removeEventListener.bind(target)
  const leave = () => {
    const event = new Event('beforeunload', { cancelable: true })
    target.dispatchEvent(event)
    return event.defaultPrevented
  }
  let cleanup = () => {}
  try {
    BackgroundTasks.clearAll()
    cleanup = BackgroundTaskWarnings.start()
    assertEquals(leave(), false)
    BackgroundTasks.publish('command', {
      label: 'Sync',
      phase: 'failed',
      blocksExit: false,
      error: 'Offline'
    })
    assertEquals(leave(), false)
    for (const phase of ['running', 'waiting', 'failed'] as const) {
      BackgroundTasks.publish('delivery', {
        label: 'Delivery',
        phase,
        blocksExit: true,
        ...(phase === 'failed' ? { error: 'Offline' } : {})
      })
      assertEquals(leave(), true)
    }
    BackgroundTasks.clearAll()
    assertEquals(leave(), false)
    for (let repeat = 0; repeat < 3; repeat++) {
      cleanup()
      cleanup()
      BackgroundTasks.publish('delivery', { label: 'Delivery', phase: 'running', blocksExit: true })
      assertEquals(leave(), false)
      cleanup = BackgroundTaskWarnings.start()
      assertEquals(leave(), true)
    }
    cleanup()
    assertEquals(leave(), false)
  } finally {
    cleanup()
    BackgroundTasks.clearAll()
    globalThis.addEventListener = add
    globalThis.removeEventListener = remove
  }
})
