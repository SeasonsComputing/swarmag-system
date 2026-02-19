/**
 * Supabase client singleton for server-side operations.
 */

import { Config } from '@core/runtime/config.ts'
import { createClient, type SupabaseClient } from '@supabase-client'

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
    if (Supabase.#cache == null) {
      Supabase.#cache = createClient(
        Config.get('SUPABASE_RDBMS_URL'),
        Config.get('SUPABASE_SERVICE_KEY'),
        { auth: { persistSession: false } }
      )
    }
    return Supabase.#cache
  }
}
