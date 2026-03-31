/**
 * Supabase client singleton for server or client RDBMS operations.
 */

import { Config } from '@core/cfg/config.ts'
import { createClient, PostgrestError, type SupabaseClient } from '@supabase/client'

/** Cache-aware Supabase client factory for platform functions. */
export class Supabase {
  /** Singleton Supabase client instance cache. */
  static #cache: SupabaseClient | null = null

  /**
   * Return a singleton Supabase client configured from environment variables.
   * Auth options are determined by SUPABASE_CLIENT_MODE: 'browser' | 'edge'.
   * @returns Reusable Supabase client.
   * @throws When required credentials are missing.
   */
  static client(): SupabaseClient {
    if (Supabase.#cache) return Supabase.#cache

    // Supabase client parameters
    const isBrowser = Config.get('SUPABASE_CLIENT_MODE') === 'browser'
    const key = isBrowser
      ? Config.get('SUPABASE_ANON_KEY')
      : Config.get('SUPABASE_SERVICE_KEY')
    const url = Config.get('SUPABASE_RDBMS_URL')
    const auth = {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser
    }

    // Connect and cache client
    Supabase.#cache = createClient(url, key, { auth })
    return Supabase.#cache
  }

  /** Map postgrest error code to status */
  static errorToStatus(error: PostgrestError): number {
    if (error.code === 'PGRST116') return 404
    if (error.code === '23505') return 409 // unique_violation
    if (error.code === '42501') return 403 // insufficient_privilege / RLS denial
    if (error.code === '23503') return 409 // fk_violation
    if (error.code === '22P02') return 400 // invalid input syntax
    return 500
  }
}
