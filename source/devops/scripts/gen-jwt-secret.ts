/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ JWT secret generator                                                        ║
║ Generates a cryptographically secure hex JWT secret for environment config. ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Prints a 64-byte random value encoded as hex for JWT_SECRET values used by
local, stage, or production environment files.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
(script entry point — no exported symbols)
*/

const bytes = new Uint8Array(64)
crypto.getRandomValues(bytes)

const jwtSecret = Array.from(bytes)
  .map(byte => byte.toString(16).padStart(2, '0'))
  .join('')

console.log(jwtSecret)
