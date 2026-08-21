/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Netlify configuration provider                                               ║
║ Runtime configuration access through Netlify.env.                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides Config with environment variable access and HTTP Response failure
behavior for Netlify Edge Function execution contexts.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ProviderNetlify  Configuration provider for Netlify Edge Functions.
├ constructor    Fail when the Netlify runtime is unavailable.
├ get(key)       Retrieve an environment variable from Netlify.env.
└ fail(msg)      Throw an HTTP 500 Response.
*/

import type { RuntimeContract } from './runtime-contract.ts'

/** Netlify.env ambient declaration */
declare const Netlify:
  | { env: { get(key: string): string | undefined } }
  | undefined

/**
 * Configuration provider for Netlify Edge Functions.
 */
export class ProviderNetlify implements RuntimeContract {
  constructor() {
    const isNetlify = 'Netlify' in globalThis
    if (!isNetlify) this.fail('Netlify runtime not available')
  }
  get(key: string): string | undefined {
    return Netlify?.env.get(key)
  }
  fail(msg: string): never {
    throw new Response(msg, { status: 500 })
  }
}
