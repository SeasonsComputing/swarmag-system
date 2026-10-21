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

SEMANTICS
───────────────────────────────────────────────────────────────────────────────
Bootstrap calls the coordinator's init() synchronously during its Solid mount
callback; generic bootstrap does not consume the application API. The
application's init() starts session resolution and registers its cleanup with
the current Solid owner. The session holds the application user through
SessionUserContract; the shell application gains no user field.
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
