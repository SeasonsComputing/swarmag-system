/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Deno configuration provider                                                  ║
║ Runtime configuration access through Deno.env.                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides Config with environment variable access and process-exit failure
behavior for plain Deno execution contexts.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DenoProvider    Configuration provider for Deno.
├ constructor   Fail when the Deno runtime is unavailable.
├ get(key)      Retrieve an environment variable from Deno.env.
└ fail(msg)     Write the message and exit the process.
*/

import { type RuntimeContract } from './runtime-contract.ts'

/**
 * Configuration provider for Deno.
 */
export class DenoProvider implements RuntimeContract {
  constructor() {
    const isDeno = 'Deno' in globalThis
    if (!isDeno) this.fail('Deno runtime not available')
  }
  get(key: string): string | undefined {
    return Deno.env.get(key)
  }
  fail(msg: string): never {
    console.error(`${msg}`)
    Deno.exit(1)
  }
}
