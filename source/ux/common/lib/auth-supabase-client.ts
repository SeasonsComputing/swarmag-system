/**
 * Supabase implementation of ApiAuthContract.
 * Registers onAuthStateChange at module load; writes session into sessionStore.
 */

import { Supabase } from '@core/db/supabase.ts'
import type { Id } from '@core/std'
import type { ApiAuthContract, Session } from '@ux/api/api-auth-contract.ts'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

/** Supabase passwordless OTP auth client. Implements ApiAuthContract. */
export const AuthSupabaseClient: ApiAuthContract = {
  /** Sends a one-time code to the provided email address via Supabase Auth. */
  async sendOtp(email: string): Promise<void> {
    const { error } = await Supabase.client().auth.signInWithOtp({ email })
    if (error) throw new Error(error.message)
  },

  /** Verifies the one-time code and returns an authenticated session. */
  async verifyOtp(email: string, code: string): Promise<Session> {
    const { data, error } = await Supabase.client().auth.verifyOtp({
      email,
      token: code,
      type: 'email'
    })
    if (error || !data.user) throw new Error(error?.message ?? 'Verification failed')
    return toSession(data.user.id)
  },

  /** Signs out the current user. onAuthStateChange fires and clears sessionStore. */
  async logout(): Promise<void> {
    const { error } = await Supabase.client().auth.signOut()
    if (error) throw new Error(error.message)
  },

  /** Returns the current session on boot; null if unauthenticated. */
  async getSession(): Promise<Session | null> {
    const { data } = await Supabase.client().auth.getSession()
    return (!data.session?.user) ? null : toSession(data.session.user.id)
  },

  /**
   * Registers a callback invoked on every auth state change.
   * Returns an unsubscribe function.
   * @param callback Receives the current Session or null on sign-out.
   */
  onAuthStateChange(callback: (session: Session | null) => void): () => void {
    const { data } = Supabase.client().auth.onAuthStateChange(
      (_event, session) => callback(session?.user ? toSession(session.user.id) : null)
    )
    return () => data.subscription.unsubscribe()
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PRIVATE
// ────────────────────────────────────────────────────────────────────────────

const toSession = (userId: string): Session => ({ userId: userId as Id })
