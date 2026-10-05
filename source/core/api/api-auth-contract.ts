/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ API contract for passwordless OTP authentication                            ║
║ Shared transport-agnostic auth session and lifecycle interface              ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines the canonical API contract for passwordless OTP authentication and
session lifecycle events used by UX shell/session orchestration.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Session - Authenticated session payload.
└ userId                       Authenticated user identifier.

ApiAuthContract - Passwordless OTP auth API contract.
├ sendOtp(email)               Send OTP to email address.
├ verifyOtp(email, code)       Verify OTP and return authenticated session.
├ logout()                     End current authenticated session.
├ getSession()                 Return current session or null.
└ onAuthStateChange(callback)  Subscribe to auth-session changes.
*/

import type { Id } from '@core/std'

/** Authenticated session returned on successful OTP verification. */
export type Session = { userId: Id }

/**
 * Passwordless OTP authentication contract.
 * Step 1 — sendOtp: delivers a one-time code to the provided email address.
 * Step 2 — verifyOtp: validates the code and returns an authenticated session.
 */
export interface ApiAuthContract {
  sendOtp(email: string): Promise<void>
  verifyOtp(email: string, code: string): Promise<Session>
  logout(): Promise<void>
  getSession(): Promise<Session | null>
  onAuthStateChange(callback: (session: Session | null) => void): () => void
}
