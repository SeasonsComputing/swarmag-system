/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Edge build metadata                                                          ║
║ Build id for edge function responses, stamped by edge-sync.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PUBLIC
───────────────────────────────────────────────────────────────────────────────
HEADER_BUILD  Response header carrying the build id.
BUILD_META    Build id; 'dev' in the repository.
*/

/** Response header carrying the edge build id. */
export const HEADER_BUILD = 'x-swarmag-build'

/** Build id stamped at edge-sync time; 'dev' in the repository. */
export const BUILD_META = 'dev'
