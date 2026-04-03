/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Supabase client for OTP auth API contract                                   ║
║ Passwordless auth operations and auth state subscription mapping            ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Implements `ApiAuthContract` using Supabase Auth with consistent API-error
mapping and a normalized `Session` return shape.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AuthSupabaseClient  Authentication singleton
*/

import type { ApiAuthContract, Session } from '@core/api/api-auth-contract.ts'
import { checkApiError, throwApiError } from '@core/api/api-contract.ts'
import { Supabase } from '@core/db/supabase.ts'
import type { Id } from '@core/std'

/** Supabase passwordless OTP auth client. Implements ApiAuthContract. */
export const AuthSupabaseClient: ApiAuthContract = {
  /**
   * Send a one-time passcode to the target email address.
   * @param email Recipient email address for OTP delivery.
   * @returns Resolves when Supabase accepts the OTP request.
   */
  async sendOtp(email: string): Promise<void> {
    const { error } = await Supabase.client().auth.signInWithOtp({ email })
    checkApiError(error, 'Failed to send OTP', authErrorStatus, authErrorDetails)
  },

  /**
   * Verify OTP and return a normalized authenticated session.
   * @param email Email address used when requesting the OTP.
   * @param code One-time passcode to verify.
   * @returns Session containing authenticated user id.
   */
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

  /**
   * Sign out the active user session.
   * @returns Resolves when sign-out completes.
   */
  async logout(): Promise<void> {
    const { error } = await Supabase.client().auth.signOut()
    checkApiError(error, 'Failed to sign out', authErrorStatus, authErrorDetails)
  },

  /**
   * Read current auth session from Supabase.
   * @returns Normalized Session when authenticated; otherwise null.
   */
  async getSession(): Promise<Session | null> {
    const { data, error } = await Supabase.client().auth.getSession()
    checkApiError(error, 'Failed to fetch session', authErrorStatus, authErrorDetails)
    return data.session?.user ? toSession(data.session.user.id) : null
  },

  /**
   * Subscribe to Supabase auth-state changes.
   * @param callback Invoked with Session on sign-in and null on sign-out.
   * @returns Unsubscribe callback that removes the Supabase subscription.
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
