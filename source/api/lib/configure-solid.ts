/**
 * Browser/SSR Solid application configuration provider.
 * Accesses environment variables via import.meta.env and throws Error.
 */

import { RuntimeConfig, type RuntimeProvider } from '@utils'

/** Solid: env forward declaration */
declare global {
  interface ImportMeta {
    env?: { [key: string]: string | undefined }
  }
}

/**
 * Configuration provider for Solid app.
 */
class SolidProvider implements RuntimeProvider {
  constructor() {
    if (!import.meta?.env) this.fail('Solid runtime not available')
  }
  get(key: string): string | undefined {
    return import.meta.env![key]
  }
  fail(msg: string): never {
    throw new Error(`Config error: ${msg}`)
  }
}

export const ConfigureSolid = new RuntimeConfig(new SolidProvider())
