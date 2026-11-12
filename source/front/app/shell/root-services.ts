/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Root services                                                                ║
║ An application bootstrap's root-lifetime services, as one mount.             ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Lets an application bootstrap declare the services that live as long as its
root. Each service starts at mount; a function it returns is its cleanup, run
when the root is disposed. The generic bootstrap receives the one mount.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
RootService   Starts a root-lifetime service; a returned function is its cleanup.
rootServices  Compose services into the bootstrap's application mount.
*/

import type { ApplicationMount } from '@ux/shell/runtime/bootstrap.tsx'

/** Starts a root-lifetime service; a returned function is its cleanup. */
export type RootService = () => void | (() => void) | Promise<void>

/** Compose root services into one mount: start each in order, release each on disposal. */
export const rootServices = (...services: readonly RootService[]): ApplicationMount => () => {
  const cleanups = services
    .map(start => start())
    .filter((result): result is () => void => typeof result === 'function')
  return () => {
    for (const cleanup of cleanups) cleanup()
  }
}
