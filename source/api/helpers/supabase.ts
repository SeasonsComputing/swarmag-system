import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export class Supabase {
  static #cache: SupabaseClient | null = null

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
}
