/**
 * Supabase client singleton for server-side operations.
 */

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

/** Cache-aware Supabase client factory for platform functions. */
export class Supabase {
  /** Singleton Supabase client instance cache. */
  static #cache: SupabaseClient | null = null

  /**
   * Return a singleton Supabase service client configured from environment variables.
   * @returns Reusable Supabase client.
   * @throws When required credentials are missing.
   */
  static client(): SupabaseClient {
    if (Supabase.#cache) return Supabase.#cache

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY')
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('Supabase credentials missing')

    Supabase.#cache = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false } },
    )

    return Supabase.#cache
  }
}
