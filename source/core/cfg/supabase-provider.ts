/**
 * Supabase Edge Functions configuration provider.
 * Accesses environment variables via Deno.env — the Supabase Edge runtime
 * exposes configuration through the standard Deno API — and throws HTTP
 * Response errors on failure.
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
