/**
 * Solid application configuration provider.
 * Accesses environment variables via import.meta.env and throws Error.
 */

import type { RuntimeProvider } from '@core/cfg/runtime-provider.ts'

/** Solid: env forward declaration */
declare global {
  interface ImportMeta {
    env?: { [key: string]: string | undefined }
  }
}

/**
 * Configuration provider for Solid app.
 */
export class SolidProvider implements RuntimeProvider {
  constructor() {
    const env = import.meta?.env
    if (!env) this.fail('Solid runtime not available')
  }
  get(key: string): string | undefined {
    const env = import.meta?.env
    return env ? env[key] : undefined
  }
  fail(msg: string): never {
    throw new Error(`Config error: ${msg}`)
  }
}
