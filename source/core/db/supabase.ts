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
   * All contexts use the public key — user identity is carried by the JWT in
   * the Authorization header. SUPABASE_CLIENT_MODE governs session persistence
   * behavior only ('browser' | 'edge').
   * @returns Reusable Supabase client.
   * @throws When required credentials are missing.
   */
  static client(): SupabaseClient {
    if (Supabase.#cache) return Supabase.#cache

    const isBrowser = Config.get('SUPABASE_CLIENT_MODE') === 'browser'
    const auth = {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser
    }
    const key = Config.get('SUPABASE_PUBLIC_KEY')
    const url = Config.get('SUPABASE_RDBMS_URL')

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
