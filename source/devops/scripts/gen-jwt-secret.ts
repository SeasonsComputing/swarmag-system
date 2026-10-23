/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ JWT secret generator                                                         ║
║ Generates a cryptographically secure hex JWT secret for environment config.  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Prints a 64-byte random value encoded as hex for JWT_SECRET values used by
dev, stage, or production environment files.

Generates a secure random hex JWT secret for environment config.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
(script entry point — no exported symbols)
*/

const BYTES = new Uint8Array(64)
crypto.getRandomValues(BYTES)

const JWT_SECRET = Array.from(BYTES)
  .map(byte => byte.toString(16).padStart(2, '0'))
  .join('')

console.log(JWT_SECRET)
