/**
 * Browser/SSR Solid application configuration provider.
 * Accesses environment variables via import.meta.env and throws Error.
 */

import { RuntimeConfig, type RuntimeProvider } from '@core-std'

/** Solid: env forward declaration */
declare global {
  interface ImportMeta {
    env?: { [key: string]: string | undefined }
  }
}

/**
 * Configuration provider for Solid app.
 */
export class ProviderSolid implements RuntimeProvider {
  get(key: string): string | undefined {
    if (!import.meta?.env) this.fail('Solid runtime not available')
    return import.meta.env![key]
  }
  fail(msg: string): never {
    throw new Error(`Config error: ${msg}`)
  }
}
