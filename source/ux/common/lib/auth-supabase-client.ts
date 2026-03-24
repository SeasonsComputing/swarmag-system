/**
 * Supabase implementation of ApiAuthContract.
 * Registers onAuthStateChange at module load; writes session into sessionStore.
 */

import { checkApiError, throwApiError } from '@core/api/api-contract.ts'
import { Supabase } from '@core/db/supabase.ts'
import type { Id } from '@core/std'
import type { ApiAuthContract, Session } from '@ux/api/api-auth-contract.ts'

/** Supabase passwordless OTP auth client. Implements ApiAuthContract. */
export const AuthSupabaseClient: ApiAuthContract = {
  /** Sends a one-time code to the provided email address via Supabase Auth. */
  async sendOtp(email: string): Promise<void> {
    const { error } = await Supabase.client().auth.signInWithOtp({ email })
    checkApiError(error, 'Failed to send OTP', authErrorStatus, authErrorDetails)
  },

  /** Verifies the one-time code and returns an authenticated session. */
  async verifyOtp(email: string, code: string): Promise<Session> {
    const { data, error } = await Supabase.client().auth.verifyOtp({
      email,
      token: code,
      type: 'email'
    })
    checkApiError(error, 'Verification failed', authErrorStatus, authErrorDetails)
    if (!data.user) throwApiError({ message: 'Verification failed' }, 'Verification failed', 401)
    return toSession(data.user.id)
  },

  /** Signs out the current user. onAuthStateChange fires and clears sessionStore. */
  async logout(): Promise<void> {
    const { error } = await Supabase.client().auth.signOut()
    checkApiError(error, 'Failed to sign out', authErrorStatus, authErrorDetails)
  },

  /** Returns the current session on boot; null if unauthenticated. */
  async getSession(): Promise<Session | null> {
    const { data, error } = await Supabase.client().auth.getSession()
    checkApiError(error, 'Failed to fetch session', authErrorStatus, authErrorDetails)
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
// INTERNALS
// ────────────────────────────────────────────────────────────────────────────

/** Convert Supabase user id to API Session shape. */
const toSession = (userId: string): Session => ({ userId: userId as Id })

/** Resolve auth error status with 401 fallback. */
const authErrorStatus = (error: { status?: number }): number => {
  const rawStatus = error.status
  return typeof rawStatus === 'number' && Number.isInteger(rawStatus) && rawStatus > 0
    ? rawStatus
    : 401
}

/** Map auth error code to ApiError details field. */
const authErrorDetails = (error: { code?: string }): string | undefined => error.code
