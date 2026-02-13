/**
 * Netlify Edge Functions configuration provider.
 * Accesses environment variables via Netlify.env and throws HTTP Response errors.
 */

import { RuntimeConfig, type RuntimeProvider } from '@core-std'

/** Netlify.env ambient declaration */
declare const Netlify:
  | { env: { get(key: string): string | undefined } }
  | undefined

/**
 * Configuration provider for Netlify Edge Functions.
 */
export class ProviderNetlify implements RuntimeProvider {
  constructor() {
    if (!Netlify) this.fail('Netlify runtime not available')
  }
  get(key: string): string | undefined {
    return Netlify!.env.get(key)
  }
  fail(msg: string): never {
    throw new Response(msg, { status: 500 })
  }
}
