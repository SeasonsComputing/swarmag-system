# Stage Test Authorization — Brief

**Active.** Recorded 2026-10-13 from a CA + AI Architect session, after the soft-deleted references
production left two test files written but unrunnable
(`effort/active/2026-10-13-soft-deleted-references-brief.md`, amendment 6). It awaits AI Coding
Engine review and the production gate.

## What triggered it

Integration tests against stage cannot run, for two reasons:

1. **The shared test configuration cannot bootstrap `api`.** `front/api/api.ts` re-exports
   `AppState`, which is backed by IndexedDB, so importing `api` needs `LOCAL_DB_NAME` registered in
   `Config`; `source/tests/config/test-config.ts` registers only `SUPABASE_RDBMS_URL`,
   `SUPABASE_PUBLIC_KEY`, and `SUPABASE_CLIENT_MODE` (backlog: "The shared test configuration
   cannot bootstrap `api`").
2. **No test holds a session.** `users-api-test.ts` calls `api.Users.create` with no
   authenticated caller, but every user write runs through an edge function that requires an
   active administrator's JWT (`architecture-back.md` §4.6), and RLS grants `SELECT` only to
   authenticated users. Fixing the bootstrap alone would fail at the first call.

## What the repository holds

- **`source/tests/config/test-config.ts`:** the shared bootstrap above. `users-api-test.ts` is its
  only importer, and has likely been unrunnable since 2026-07-19 (`cdc6ebb`).
- **`customer-api-test.ts`** sidesteps the bootstrap with its own `Config.init` registering
  `LOCAL_DB_NAME`, and an in-memory transport.
- **`session-coordinator-test.ts`** (soft-deleted references production) imports the shared
  configuration and replaces `api` members with stubs; it needs the bootstrap, not a session.
- **Genesis seeds identities.** `schema.sql` seeds `devops-admin@swarmag.com` in `auth.users`
  (`INSERT ... ON CONFLICT (id) DO UPDATE`, idempotent) and in `users` with the `administrator`
  role (`architecture-devops.md` §12).
- **Sign-in is passwordless email OTP** (`architecture-front.md` §9.3.2); no human can type a code
  in an automated run.
- **The service key** is read by edge configuration (`supabase-config.ts`) as
  `SUPABASE_SERVICE_KEY`; no test or devops script reads it.

## Decisions (CA, 2026-10-13)

1. **A seeded test administrator.** Genesis seeds a dedicated test identity in `auth.users` and
   `users`, with the `administrator` role, beside `devops-admin`. It is separate so that test
   activity is attributable and never mistaken for real use. It belongs to stage only: genesis
   applies one `schema.sql` everywhere, so a production genesis, when production exists, must
   exclude it.
2. **Real sessions, minted in setup.** Test setup uses the service key only to generate a sign-in
   token for the test identity (`auth.admin.generateLink`), then redeems it through the public
   client (`verifyOtp`). Tests run as that user, through real RLS and real edge functions. The
   fixture asserts that the redeemed session's user id is the seeded test administrator's id, so a
   misconfigured email cannot run the tests as another administrator. `generateLink` sends no
   mail, so the address need not be deliverable.
3. **The service key stays in setup.** It comes from local environment, never from the
   repository, and is never used for a test's own calls: those would bypass RLS, and the edge
   functions require a domain user's JWT. The fixture reads the key itself, only when a test asks
   for a session; `test-config.ts` does not require it, so database-free tests run without it.
4. **Leftover rows are acceptable.** Soft deletes keep test rows; the next genesis run resets
   stage.
5. **The bootstrap fix lands here.** `test-config.ts` registers `LOCAL_DB_NAME`, retiring the
   backlog entry.

Rejected: calling the API with the service key (skips RLS; refused by the edge functions), and
password sign-in for a test user (a second sign-in method on stage that production lacks).

## Production scope

Operating mode: **Foundation** (authentication boundary, seed data, test infrastructure).

| Where                                      | Change                                                           |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `domain/schema/schema.sql`                 | Seed the test administrator in `auth.users` and `users`.         |
| `source/tests/config/test-config.ts`       | Register `LOCAL_DB_NAME`.                                        |
| `source/tests/` (a shared session fixture) | Mint and redeem the test administrator's session in setup.       |
| `source/tests/cases/users-api-test.ts`     | Sign in through the fixture before its calls.                    |
| `architecture-devops.md`                   | Running integration tests against stage: identity, key, genesis. |

**Out of scope:** coverage above the domain/API layer (backlog: "No automated coverage above the
domain/API layer"); test isolation beyond genesis resets; a test environment other than stage.

## Open

1. **The test identity's email,** for example `test-admin@swarmag.com`.
2. **The environment variable** that carries the service key into test setup, and whether it
   reuses `SUPABASE_SERVICE_KEY`.

## Checks

`deno task check`, `deno task fmt:check`; `STYLE_AUDIT`. After a genesis run, by the CA:
`users-api-test.ts` and `session-coordinator-test.ts` run green against stage.

## Design history

- **2026-10-13:** recorded as the soft-deleted references production left its tests unrunnable;
  the CA moved testing up in priority.

_End of Brief_
