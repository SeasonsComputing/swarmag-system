/**
 * Deno runtime configuration provider.
 * Accesses environment variables via Deno.env and exits process on error.
 */

import type { RuntimeProvider } from './runtime-provider.ts'

/**
 * Configuration provider for Deno.
 */
export class DenoProvider implements RuntimeProvider {
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
