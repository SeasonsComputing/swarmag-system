/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Background task exit warnings                                                ║
║ Disposable browser warnings for explicitly owned pending work.               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Cancels beforeunload only while a report explicitly blocks exit. Admin installs
this service through bootstrap's application mount callback. Cleanup releases
its listener. Browser policy controls whether a prompt appears and its wording;
this does not veto logout or guarantee mobile process-termination warnings.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
startBackgroundTaskWarnings  Install warnings and return listener cleanup.
*/

import { BackgroundTasks } from './background-tasks.ts'

/** Install one listener; the caller owns its returned cleanup. */
export const startBackgroundTaskWarnings = (): () => void => {
  const beforeUnload = (event: BeforeUnloadEvent): void => {
    if (!Object.values(BackgroundTasks.store).some(task => task.blocksExit)) return
    event.preventDefault()
    event.returnValue = ''
  }
  globalThis.addEventListener('beforeunload', beforeUnload)
  return () => globalThis.removeEventListener('beforeunload', beforeUnload)
}
