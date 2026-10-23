/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Stage session fixture tests                                                  ║
║ Verify real SDK session setup and cleanup using an offline HTTP transport.   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Proves service credentials mint tokens only, public-client redemption attaches
the session used by api, mismatched identity prevents test work, and local
cleanup follows success and failure without revoking unrelated sessions.
*/

import { DenoProvider } from '@core/cfg/deno-provider.ts'
import { Supabase } from '@core/db/supabase.ts'
import type { Dictionary, StringDictionary } from '@core/std'
import { assert, assertEquals, assertRejects, assertStrictEquals } from '@std/assert'
import { StageSession } from '../fixtures/stage-session.ts'

Deno.test('stage session authenticates the public API and cleans up only its session', async context => {
  const Values: StringDictionary = {
    SUPABASE_RDBMS_URL: 'http://stage-session.invalid',
    SUPABASE_PUBLIC_KEY: 'offline-public-key',
    SUPABASE_CLIENT_MODE: 'edge',
    LOCAL_DB_NAME: 'stage-session-test',
    SUPABASE_SERVICE_ROLE_KEY: 'offline-service-key'
  }
  const originalGet = DenoProvider.prototype.get
  const originalFetch = globalThis.fetch
  const CALLS: { path: string; authorization: string | null; key: string | null }[] = []
  const LOGOUT_SCOPES: (string | null)[] = []
  let verifiedId = StageSession.id
  let cleanupRejected = false
  let accessToken = ''
  DenoProvider.prototype.get = name => Values[name]
  globalThis.fetch = async (input, init) => {
    const RequestValue = new Request(input, init)
    const Url = new URL(RequestValue.url)
    assertEquals(Url.origin, Values.SUPABASE_RDBMS_URL)
    CALLS.push({
      path: Url.pathname,
      authorization: RequestValue.headers.get('authorization'),
      key: RequestValue.headers.get('apikey')
    })
    if (Url.pathname === '/auth/v1/admin/generate_link') {
      assertEquals(RequestValue.method, 'POST')
      assertEquals(
        RequestValue.headers.get('authorization'),
        `Bearer ${Values.SUPABASE_SERVICE_ROLE_KEY}`
      )
      assertEquals(RequestValue.headers.get('apikey'), Values.SUPABASE_SERVICE_ROLE_KEY)
      assertEquals(await RequestValue.json(), { type: 'magiclink', email: StageSession.email })
      return Response.json({
        id: StageSession.id,
        email: StageSession.email,
        action_link: 'http://stage-session.invalid/unused',
        email_otp: '123456',
        hashed_token: 'offline-hashed-token',
        redirect_to: '',
        verification_type: 'magiclink'
      })
    }
    if (Url.pathname === '/auth/v1/verify') {
      assertEquals(RequestValue.method, 'POST')
      assertEquals(RequestValue.headers.get('authorization'), `Bearer ${Values.SUPABASE_PUBLIC_KEY}`)
      assertEquals(RequestValue.headers.get('apikey'), Values.SUPABASE_PUBLIC_KEY)
      const Body = await RequestValue.json() as Dictionary
      assertEquals(Body.email, StageSession.email)
      assertEquals(Body.token, '123456')
      assertEquals(Body.type, 'email')
      const EXPIRES_AT = Math.floor(Date.now() / 1000) + 3600
      accessToken = [
        btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
        btoa(JSON.stringify({ sub: verifiedId, role: 'authenticated', exp: EXPIRES_AT })),
        'offline-signature'
      ].map(part => part.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')).join('.')
      return Response.json({
        access_token: accessToken,
        refresh_token: 'offline-refresh-token',
        expires_in: 3600,
        expires_at: EXPIRES_AT,
        token_type: 'bearer',
        user: {
          id: verifiedId,
          email: StageSession.email,
          aud: 'authenticated',
          role: 'authenticated',
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: {},
          created_at: '2026-10-23T00:00:00Z'
        }
      })
    }
    assertEquals(RequestValue.headers.get('apikey'), Values.SUPABASE_PUBLIC_KEY)
    assertEquals(RequestValue.headers.get('authorization'), `Bearer ${accessToken}`)
    if (Url.pathname === '/auth/v1/logout') {
      assertEquals(RequestValue.method, 'POST')
      LOGOUT_SCOPES.push(Url.searchParams.get('scope'))
      if (cleanupRejected) return Response.json({ msg: 'Offline cleanup rejection' }, { status: 400 })
      return new Response(null, { status: 204 })
    }
    if (Url.pathname === '/rest/v1/users') {
      assertEquals(RequestValue.method, 'GET')
      return Response.json([])
    }
    throw new Error(`Unexpected offline stage-session request: ${RequestValue.method} ${Url.pathname}`)
  }

  try {
    const { Config } = await import('../config/stage-config.ts')
    const { api: Api } = await import('@front/api/api.ts')
    assertEquals(Config.get('SUPABASE_SERVICE_KEY'), Values.SUPABASE_SERVICE_ROLE_KEY)

    await context.step('correct identity attaches to the API public client and cleans up', async () => {
      const Public = Supabase.client()
      const RESULT = await StageSession.run(async () => {
        assertStrictEquals(Supabase.client(), Public)
        assertEquals((await Api.Auth.getSession())?.userId, StageSession.id)
        assertEquals((await Api.Users.list()).data, [])
        return 'completed'
      })
      assertEquals(RESULT, 'completed')
      assertEquals(await Api.Auth.getSession(), null)
      assertEquals(CALLS.map(call => call.path), [
        '/auth/v1/admin/generate_link',
        '/auth/v1/verify',
        '/rest/v1/users',
        '/auth/v1/logout'
      ])
    })

    await context.step('wrong redeemed identity prevents test work and cleans up', async () => {
      verifiedId = '01a1679c-be97-76f3-befc-8dd3e23161ac'
      let called = false
      await assertRejects(
        () =>
          StageSession.run(() => {
            called = true
            return Promise.resolve()
          }),
        Error,
        'must belong to the seeded Test Administrator'
      )
      assertEquals(called, false)
      assertEquals(await Api.Auth.getSession(), null)
      verifiedId = StageSession.id
    })

    await context.step('callback failure still cleans up the public session', async () => {
      const Failure = new Error('Offline callback failure')
      const ErrorValue = await assertRejects(() => StageSession.run(() => Promise.reject(Failure)))
      assertStrictEquals(ErrorValue, Failure)
      assertEquals(await Api.Auth.getSession(), null)
    })

    await context.step('cleanup rejection is reported instead of claiming success', async () => {
      cleanupRejected = true
      try {
        await assertRejects(() => StageSession.run(() => Promise.resolve()), Error, 'cleanup failed')
      } finally {
        cleanupRejected = false
        const { error: CleanupError } = await Supabase.client().auth.signOut({ scope: 'local' })
        assertEquals(CleanupError, null)
      }
      assertEquals(await Api.Auth.getSession(), null)
    })

    await context.step('callback and cleanup failures both remain observable', async () => {
      const Failure = new Error('Offline callback failure during rejected cleanup')
      cleanupRejected = true
      try {
        const ErrorValue = await assertRejects(
          () => StageSession.run(() => Promise.reject(Failure)),
          AggregateError,
          'Stage session and cleanup failed'
        )
        assertStrictEquals(ErrorValue.errors[0], Failure)
        assertEquals(ErrorValue.errors[1].message, 'Stage session cleanup failed')
      } finally {
        cleanupRejected = false
        const { error: CleanupError } = await Supabase.client().auth.signOut({ scope: 'local' })
        assertEquals(CleanupError, null)
      }
      assertEquals(await Api.Auth.getSession(), null)
    })

    assertEquals(LOGOUT_SCOPES, ['local', 'local', 'local', 'local', 'local', 'local', 'local'])
    assert(
      CALLS.filter(call => call.key === Values.SUPABASE_SERVICE_ROLE_KEY)
        .every(call => call.path === '/auth/v1/admin/generate_link')
    )
  } finally {
    DenoProvider.prototype.get = originalGet
    globalThis.fetch = originalFetch
  }
})
