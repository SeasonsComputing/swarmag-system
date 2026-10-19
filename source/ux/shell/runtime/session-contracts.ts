/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Application session contracts                                                ║
║ Application-supplied session coordination and signed-in user.                ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Declares what applications supply to the generic session runtime without
introducing dependencies on application domain types.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
SessionCoordinatorContract  Application-owned session initialization.
SessionUserContract         Application-supplied prepared user.
*/

import type { Id } from '@core/std'

/** Application-owned session initialization, called synchronously during mount. */
export interface SessionCoordinatorContract {
  init(): void
  clear(): void
}

/** Application-supplied signed-in user, held by the session for its lifetime. */
export interface SessionUserContract {
  id(): Id | null
  roles(): readonly string[]
}
