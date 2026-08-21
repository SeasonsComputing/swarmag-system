/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Supabase configuration provider                                              ║
║ Edge runtime configuration access through Deno.env.                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides Config with environment variable access and HTTP Response failure
behavior for Supabase Edge Function execution contexts.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
SupabaseProvider  Configuration provider for Supabase Edge Functions.
├ constructor     Fail when the Deno runtime is unavailable.
├ get(key)        Retrieve an environment variable from Deno.env.
└ fail(msg)       Throw an HTTP 500 Response.
*/

import { type RuntimeContract } from './runtime-contract.ts'

/**
 * Configuration provider for Supabase edge functions.
 */
export class SupabaseProvider implements RuntimeContract {
  constructor() {
    const isDeno = 'Deno' in globalThis
    if (!isDeno) this.fail('Deno runtime not available')
  }
  get(key: string): string | undefined {
    return Deno.env.get(key)
  }
  fail(msg: string): never {
    throw new Response(msg, { status: 500 })
  }
}
