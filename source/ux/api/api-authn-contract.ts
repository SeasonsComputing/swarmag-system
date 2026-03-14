/**
 * Authentication (AuthN) API contract.
 */

import type { User } from '@domain/abstractions/user.ts'

/** Credentials payload for password-based logon. */
export type LogonInput = { username: string; password: string }

/** Authenticated session returned on successful logon. */
export type Session = { user: User }

/**
 * Contract for credentialed authn and passwordless authn.
 */
export interface ApiAuthnContract {
  logon(credentials: LogonInput): Promise<Session>
  logout(): Promise<void>
  forgotPassword(email: string): Promise<void>
  requestAccessCode(contact: string): Promise<void>
  verifyAccessCode(contact: string, code: string): Promise<Session>
}
