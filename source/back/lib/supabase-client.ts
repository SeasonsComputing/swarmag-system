/**
 * Supabase client singleton for server-side operations.
 */

import { createClient, type SupabaseClient } from '@supabase/client'
//import { Config } from '../config/serverless-config.ts'

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

    // TODO: critical!
    const SUPABASE_URL = 'https://data.swarmag.com' //Config.get('SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = `supabase-key` //Config.get('SUPABASE_SERVICE_KEY')

    Supabase.#cache = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    })

    return Supabase.#cache
  }
}
