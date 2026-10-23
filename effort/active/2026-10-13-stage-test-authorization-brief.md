# Stage Test Authorization — Brief

**Active.** Recorded 2026-10-13 from a CA + AI Architect session, after the soft-deleted references
production left two test files written but unrunnable
(`effort/completed/2026-10-13-soft-deleted-references-brief.md`, amendment 6). It awaits AI Coding
Engine review and the production gate.

## What triggered it

Integration tests against stage cannot run, for two reasons:

1. **The shared test configuration cannot bootstrap `api`.** `front/api/api.ts` re-exports
   `AppState`, which is backed by IndexedDB, so importing `api` needs `LOCAL_DB_NAME` registered in
   `Config`; `source/tests/config/test-config.ts` registers only `SUPABASE_RDBMS_URL`,
   `SUPABASE_PUBLIC_KEY`, and `SUPABASE_CLIENT_MODE` (backlog: B-22 "The shared test configuration
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

**Out of scope:** coverage above the domain/API layer (backlog: B-21 "No automated coverage above the
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

## Amendment — 2026-10-19 — Backlog entry text folded in

The backlog entry B-22 "The shared test configuration cannot bootstrap `api`" carried its own description, now replaced there by a link to this
brief. Its text, kept here so nothing is lost:

> Since 2026-07-19 (`cdc6ebb`), `front/api/api.ts` re-exports `AppState`, which is backed by
> IndexedDB. Importing `api` therefore needs `LOCAL_DB_NAME` registered in `Config`.
> `source/tests/config/test-config.ts` registers only `SUPABASE_RDBMS_URL`,
> `SUPABASE_PUBLIC_KEY`, and `SUPABASE_CLIENT_MODE`.
>
> - **Affected:** `users-api-test.ts`, the only test that loads the shared config. It fails at
>   bootstrap, before any test runs, and has likely been unrunnable since 07-19 without anyone
>   noticing. It is a live integration test that needs stage credentials, so it rarely runs.
> - **Workaround in place:** `customer-api-test.ts` sidesteps the problem with its own
>   `Config.init`, which registers `LOCAL_DB_NAME`, and an in-memory transport.
> - **Unexecuted coverage:** the avatar-preservation case added by
>   `effort/completed/2026-10-02-update-scopes-brief.md` has never run. No UI can set an avatar,
>   so no live walkthrough can verify that property either. Since 2026-10-04 it has structural
>   coverage: `make-scope-test.ts` shows the Users scope's projections never emit `avatarUrl`.
>
> The fix belongs in the shared test configuration, not in each test. Also decide whether a test
> runtime should load browser-backed stores through `api` at all.
>
> - **Second blocker, behind the first (found 2026-10-03):** `users-api-test.ts` never signs in.
>   Every User write passes `UserOrchestra.authorizeAdmin`, which requires a verified caller with an
>   active `administrator` domain row. Sign-in is passwordless OTP only, so the test needs its own
>   route to an administrator session (an admin-generated link, or a dedicated test identity on
>   stage). Stage is the only environment, so that is an authorization-boundary decision. Fixing
>   bootstrap alone moves the failure from import to authorization.
> - **No standard way to supply stage configuration (found 2026-10-11):** `deno task test` loads
>   no env file, so a configured test runs only where someone has exported the variables by hand,
>   and none is run routinely. The list-query production therefore carries no database-backed
>   automated tests: its Postgres behavior is verified in the app against a checklist, and its
>   automated tests need no database (`effort/completed/2026-10-11-list-query-brief.md`).

## Amendment — 2026-10-22 — A contradictory assertion in `users-api-test.ts`

Found by the charter experiment (`effort/completed/2026-10-21-charter-experiment-brief.md`):
`users-api-test.ts:62` expects an inactive status after an update the neighboring assertions treat
as active. The test has never run, so nothing has shown it. It is corrected when this brief first
runs the test.

_End of Brief_
