/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Stage session fixture                                                        ║
║ Run a test as the seeded administrator through the public API client.        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Uses an ephemeral service-role client only to mint a passwordless sign-in
token. Redeems it into the public client used by api, checks the fixed seeded
identity before the test runs, and signs out only this session in finally.
The test driver imports stage-config.ts before using this fixture.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
StageSession       Authenticated stage test fixture.
├ id               Seeded Test Administrator identity.
├ email            Seeded Test Administrator sign-in address.
└ run(callback)    Authenticate, verify identity, run, and clean up the session.
*/

import { Config } from '@core/cfg/config.ts'
import { Supabase } from '@core/db/supabase.ts'
import { toId } from '@core/std'
import { createClient } from '@supabase/client'

/** Authenticated stage test fixture for the dedicated seeded administrator. */
export const StageSession = {
  id: toId('01a1679c-be97-76f3-befc-8dd3e23161ab'),
  email: 'test-admin@swarmag.com',

  /**
   * Run with the Test Administrator's session in the application's public client.
   * @param callback Test work executed only after the seeded identity is verified.
   * @returns The callback result after session-local cleanup.
   */
  async run<T>(callback: () => Promise<T>): Promise<T> {
    const Public = Supabase.client()
    const Service = createClient(
      Config.get('SUPABASE_RDBMS_URL'),
      Config.get('SUPABASE_SERVICE_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    )
    let outcome: { value: T } | { error: unknown }
    let cleanupFailure: { error: unknown } | undefined
    try {
      const Mint = await Service.auth.admin.generateLink({
        type: 'magiclink',
        email: StageSession.email
      })
      if (Mint.error) throw new Error('Stage session token generation failed', { cause: Mint.error })

      const Verified = await Public.auth.verifyOtp({
        email: StageSession.email,
        token: Mint.data.properties.email_otp,
        type: 'email'
      })
      if (Verified.error) throw new Error('Stage session verification failed', { cause: Verified.error })
      if (!Verified.data.session || Verified.data.session.user.id !== StageSession.id) {
        throw new Error('Stage session must belong to the seeded Test Administrator')
      }
      outcome = { value: await callback() }
    } catch (error) {
      outcome = { error }
    } finally {
      try {
        const { error: CleanupError } = await Public.auth.signOut({ scope: 'local' })
        if (CleanupError) cleanupFailure = { error: CleanupError }
      } catch (error) {
        cleanupFailure = { error }
      }
    }
    if (cleanupFailure) {
      const CleanupError = new Error('Stage session cleanup failed', { cause: cleanupFailure.error })
      if ('error' in outcome) {
        throw new AggregateError([outcome.error, CleanupError], 'Stage session and cleanup failed')
      }
      throw CleanupError
    }
    if ('error' in outcome) throw outcome.error
    return outcome.value
  }
}
