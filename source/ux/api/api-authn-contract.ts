/**
 * Authentication (AuthN) API contract.
 */

import type { Id } from '@core/std'

/** Authenticated session returned on successful OTP verification. */
export type Session = { userId: Id }

/**
 * Passwordless OTP authentication contract.
 * Step 1 — sendOtp: delivers a one-time code to the provided email address.
 * Step 2 — verifyOtp: validates the code and returns an authenticated session.
 */
export interface ApiAuthnContract {
  sendOtp(email: string): Promise<void>
  verifyOtp(email: string, code: string): Promise<Session>
  logout(): Promise<void>
  getSession(): Promise<Session | null>
  onAuthStateChange(callback: (session: Session | null) => void): () => void
}
