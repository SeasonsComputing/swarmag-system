/**
 * Authentication (AuthN) Api Contract
 */

import type { User } from '@domain/abstractions/user.ts'

// Placeholders. TODO: where should non-domain protocol et al belong?
type LogonInput = { username: string; password: string }
type Session = { id: string; user: User }

/** Contract for credentialed authn and passwordless authn */
export interface ApiAuthnContract {
  logon(credentials: LogonInput): Promise<Session>
  logout(): Promise<void>
  forgotPassword(email: string): Promise<void>
  requestAccessCode(contact: string): Promise<void> // customer passwordless
  verifyAccessCode(contact: string, code: string): Promise<Session>
}
