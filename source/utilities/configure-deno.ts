/**
 * Deno runtime configuration provider.
 * Accesses environment variables via Deno.env and exits process on error.
 */

import { RuntimeConfig, type RuntimeProvider } from '@utils'

/**
 * Configuration provider for Deno.
 */
class DenoProvider implements RuntimeProvider {
  constructor() {
    if (!Deno?.env) this.fail('Deno runtime not available')
  }
  get(key: string): string | undefined {
    return Deno.env.get(key)
  }
  fail(msg: string): never {
    console.error(`Config error: ${msg}`)
    Deno.exit(1)
  }
}

const ConfigureDeno = new RuntimeConfig(new DenoProvider())

export { ConfigureDeno }
