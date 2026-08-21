/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Solid configuration provider                                                 ║
║ Runtime configuration access through import.meta.env.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides Config with environment variable access and Error-based failure
behavior for Solid application execution contexts.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
SolidProvider   Configuration provider for Solid applications.
├ constructor   Fail when import.meta.env is unavailable.
├ get(key)      Retrieve an environment variable from import.meta.env.
└ fail(msg)     Throw a configuration Error.
*/

import type { RuntimeContract } from './runtime-contract.ts'

/** Solid: env forward declaration */
declare global {
  interface ImportMeta {
    env?: { [key: string]: string | undefined }
  }
}

/**
 * Configuration provider for Solid app.
 */
export class SolidProvider implements RuntimeContract {
  constructor() {
    const env = import.meta.env
    if (!env) this.fail('Solid runtime not available')
  }
  get(key: string): string | undefined {
    const env = import.meta.env
    return env ? env[key] : undefined
  }
  fail(msg: string): never {
    throw new Error(`Config error: ${msg}`)
  }
}
