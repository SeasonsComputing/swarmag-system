/**
 * Solid application configuration provider.
 * Accesses environment variables via import.meta.env and throws Error.
 */

import type { RuntimeProvider } from '@core/runtime/runtime-provider.ts'

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
    const isSolid = import.meta?.env !== undefined
    if (!isSolid) this.fail('Solid runtime not available')
  }
  get(key: string): string | undefined {
    return import.meta?.env![key]
  }
  fail(msg: string): never {
    throw new Error(`Config error: ${msg}`)
  }
}
