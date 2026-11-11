/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Supabase client manager                                                      ║
║ Singleton RDBMS client configured from runtime configuration.                ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Creates and caches the Supabase RDBMS client for browser and edge contexts, and
maps common PostgREST error codes to HTTP-style status codes.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Supabase               Supabase client manager.
├ client()             Return the singleton Supabase client.
├ storageRoot(rootKey) Resolve a configured native Storage root.
├ storageRequest(...)  Authenticated Storage REST for SDK gaps.
└ errorToStatus(...)   Map PostgREST error codes to HTTP-style status codes.
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

  /**
   * Resolve the native Storage root a configuration key names.
   * @param rootKey - Configuration key naming the root.
   * @returns The validated native bucket id.
   */
  static storageRoot(rootKey: string): string {
    const root = Config.get(rootKey)
    if (!STORAGE_ROOT_REGEX.test(root)) Config.fail(`Invalid Storage root: ${rootKey}`)
    return root
  }

  /** Issue a Storage API request with the given client's current caller session. */
  static async storageRequest(
    client: SupabaseClient,
    path: string,
    init: RequestInit
  ): Promise<Response> {
    const { data, error } = await client.auth.getSession()
    if (error) throw error
    const headers = new Headers(init.headers)
    headers.set('apikey', Config.get('SUPABASE_PUBLIC_KEY'))
    headers.set(
      'authorization',
      `Bearer ${data.session?.access_token ?? Config.get('SUPABASE_PUBLIC_KEY')}`
    )
    return await fetch(`${Config.get('SUPABASE_RDBMS_URL')}/storage/v1/${path}`, { ...init, headers })
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

/** Valid native Storage bucket id. */
const STORAGE_ROOT_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/
