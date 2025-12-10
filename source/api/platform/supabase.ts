import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Default pagination limit when not specified. */
const DEFAULT_LIMIT = 25

/** Maximum allowed pagination limit. */
const MAX_LIMIT = 100

/** Default pagination cursor when not specified. */
const DEFAULT_CURSOR = 0

/** Cache-aware Supabase client factory for platform functions. */
export class Supabase {
  /** Singleton Supabase client instance cache. */
  static #cache: SupabaseClient | null = null

  /**
   * Return a singleton Supabase service client configured from environment variables.
   * @returns {SupabaseClient} Reusable Supabase client.
   * @throws {Error} When required credentials are missing.
   */
  static client(): SupabaseClient {
    if (Supabase.#cache) return Supabase.#cache

    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('Supabase credentials missing')

    Supabase.#cache = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false, } }
    )

    return Supabase.#cache
  }

  /**
   * Clamp a pagination limit to the range 1-100, defaulting to 25 when unset.
   * @param value Raw limit value from the query string.
   * @returns Clamped limit value.
   */
  static clampLimit(value?: string | null): number {
    const parsed = Number.parseInt(value ?? '', 10)
    if (Number.isNaN(parsed) || parsed <= 0) {
      return DEFAULT_LIMIT
    }

    return Math.min(parsed, MAX_LIMIT)
  }

  /**
   * Parse a pagination cursor to a non-negative integer, defaulting to 0.
   * @param value Raw cursor value from the query string.
   * @returns Parsed cursor.
   */
  static parseCursor(value?: string | null): number {
    const parsed = Number.parseInt(value ?? '', 10)
    return Number.isNaN(parsed) || parsed < 0 ? DEFAULT_CURSOR : parsed
  }
}
