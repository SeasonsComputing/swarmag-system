/**
 * Supabase Edge Functions configuration provider.
 * Accesses environment variables via Supabase.env and throws HTTP Response errors.
 */

import type { RuntimeProvider } from './runtime-provider.ts'

/** Supabase.env ambient declaration */
declare const Supabase:
  | { env: { get(key: string): string | undefined } }
  | undefined

/**
 * Configuration provider for Supabase edge functions.
 */
export class SupabaseProvider implements RuntimeProvider {
  constructor() {
    if (!Supabase) this.fail('ProviderSupabase runtime not available')
  }
  get(key: string): string | undefined {
    return Supabase.env.get(key)
  }
  fail(msg: string): never {
    throw new Response(msg, { status: 500 })
  }
}
