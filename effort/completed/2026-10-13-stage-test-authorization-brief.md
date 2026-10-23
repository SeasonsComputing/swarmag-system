# Stage Test Authorization — Brief

**Closed 2026-10-23.** Integration tests run against stage as a seeded test administrator, through
real RLS and edge functions, and database-free tests stay credential-free. Recorded 2026-10-13 from
a CA + AI Architect session, after the soft-deleted references production left two test files
written but unrunnable (`effort/completed/2026-10-13-soft-deleted-references-brief.md`, amendment
6). Its Open items were settled by the amendment "Open items settled"; the AI Coding Engine's review
by "ACE review resolved".

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

1. _[Stage-only stated as a condition by "ACE review resolved".]_ **A seeded test administrator.**
   Genesis seeds a dedicated test identity in `auth.users` and `users`, with the `administrator`
   role, beside `devops-admin`. It is separate so that test activity is attributable and never
   mistaken for real use. It belongs to stage only: genesis applies one `schema.sql` everywhere, so
   a production genesis, when production exists, must exclude it.
2. **Real sessions, minted in setup.** Test setup uses the service key only to generate a sign-in
   token for the test identity (`auth.admin.generateLink`), then redeems it through the public
   client (`verifyOtp`). Tests run as that user, through real RLS and real edge functions. The
   fixture asserts that the redeemed session's user id is the seeded test administrator's id, so a
   misconfigured email cannot run the tests as another administrator. `generateLink` sends no
   mail, so the address need not be deliverable.
3. _[Entry point settled by "ACE review resolved".]_ **The service key stays in setup.** It comes from local environment, never from the
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

| Where                                           | Change                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| `domain/schema/schema.sql`                      | Seed the test administrator in `auth.users` and `users`.         |
| `source/tests/config/test-config.ts`            | Register `LOCAL_DB_NAME`.                                        |
| `source/tests/` (a shared session fixture)      | Mint and redeem the test administrator's session in setup.       |
| `source/tests/cases/users-api-test.ts`          | Sign in through the fixture before its calls.                    |
| `architecture-devops.md`                        | Running integration tests against stage: identity, key, genesis. |
| `architecture-back.md` (amended)                | The test administrator; the stale seed-upsert paragraph.         |
| `source/tests/config/stage-config.ts` (amended) | New: the stage tests' configuration entry point.                 |

**Out of scope:** coverage above the domain/API layer (backlog: B-21 "No automated coverage above the
domain/API layer"); test isolation beyond genesis resets; a test environment other than stage.

## Open

1. _[Settled by "Open items settled".]_ **The test identity's email,** for example
   `test-admin@swarmag.com`.
2. _[Settled by "Open items settled".]_ **The environment variable** that carries the service key
   into test setup, and whether it reuses `SUPABASE_SERVICE_KEY`.

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

## Amendment — 2026-10-22 — Open items settled

1. **The test identity is `test-admin@swarmag.com`,** which delivers to the CA's inbox. Tests never
   read it: the fixture mints the session with the service key.
2. **The service key reaches tests as the edge functions receive it:** `Config` name
   `SUPABASE_SERVICE_KEY`, sourced from Supabase's standard environment variable
   `SUPABASE_SERVICE_ROLE_KEY` (`back/supabase-edge/config/supabase-config.ts`). One name for the
   key across the system.
3. **Scope narrows by one row.** `test-config.ts` already registers `LOCAL_DB_NAME`: B-22 was
   repaired in the charter experiment (`effort/completed/2026-10-21-charter-experiment-brief.md`).

## Amendment — 2026-10-23 — ACE review resolved

The AI Coding Engine reviewed the brief and its amendments; the AI Architect verified each point in
the source.

1. **Genesis is total; its documentation is not.** `schema.sql` deletes every `auth.users` row and
   recreates the seeds, but `architecture-back.md` still describes an email-preserving
   `ON CONFLICT (id) DO UPDATE`. The code is current: the paragraph is corrected in this
   production.
2. **The seed is authored in `architecture-back.md`.** The genesis prompt regenerates `schema.sql`
   from the authority documents, and only `architecture-back.md` describes the bootstrap
   administrator. The test administrator is described there first; `schema.sql` follows, seeding
   `auth.users`, its `auth.identities` row as `devops-admin` has, and `users`.
3. **Stage-only is a stated condition, not a mechanism.** Genesis applies one `schema.sql` to every
   target, and stage is the only environment, so the seed is correct today. Excluding it from a
   production genesis is decided when production is created (parking lot: P-11).
4. **Stage tests have their own configuration entry point.** A `-test.ts` file is the driver: its
   bootstrap import declares what its runtime needs. `source/tests/config/stage-config.ts`, built
   like `test-config.ts`, registers the service key as the edge functions do
   (`SUPABASE_SERVICE_KEY` from `SUPABASE_SERVICE_ROLE_KEY`) and re-exports `Config`. A test that
   signs in imports it; every other test keeps `test-config.ts` and never needs the key. The
   session is redeemed into the public client `api` uses.
5. **`session-coordinator-test.ts` needs no session;** it stubs `api` and needs only the bootstrap,
   which B-22 repaired.

**Locked files opened for this brief only,** by the CA, 2026-10-23:
`source/domain/schema/schema.sql` (the test administrator's seed rows),
`documentation/architecture/architecture-back.md` (the test administrator and the seed paragraph),
and `documentation/architecture/architecture-devops.md` (the running-tests section).

## Amendment — 2026-10-23 — Foundation production ledger

**Authorized and in progress.** The CA approved the reviewed Foundation scope, explicitly
including the stale genesis wording and SQL example in `architecture-devops.md` §§12.2–12.3.
The available-model authorization persists. Locked documentation and schema are opened only for
this production. No live operation is authorized by this ledger: the CA separately applies genesis
and runs live stage tests after review.

Documentation leads implementation. Backend §4.4 now authors Test Administrator
`test-admin@swarmag.com`, fixed UUID v7 `01a1679c-be97-76f3-befc-8dd3e23161ab`, role
`administrator`, status `active`, and no deletion timestamp. The auth user, email identity, and
domain user share that ID and preserve passwordless authentication. The temporary approved
`source/devops/genesis/seed-ids.txt` pool holds this single ID from core `id()` for schema
consumption, then is deleted. The initial allocation attempt generated an unpersisted value but
failed before output because the directory did not exist; after creating the approved directory,
the recorded pool was written successfully. Only the published ID above is assigned to a seed.

`architecture-back.md`'s email-preserving upsert paragraph is replaced by current total-genesis
semantics. DevOps §§12.2–12.3 now describe deleting all auth users and inserting seeds/identities,
with an `instance_id` zero UUID example and all four non-null empty-string auth fields plus a
non-null confirmation timestamp retained. New §12.4 documents the stage entry point and CA-run
commands, setup-only service key alias, strict edge mode before singleton creation, fixed-identity
assertion, public-client redemption, and callback/finally local sign-out lifecycle. The schema and
test agents received the documentation-ready signal and the fixed UUID before implementation.

### Disjoint assignments and bounds

| Owner        | Files and production                                                                                                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Record agent | `documentation/architecture/architecture-back.md`, `documentation/architecture/architecture-devops.md`, this active brief, and one new B-33 entry in `effort/project/project-backlog.md`; temporary single-ID pool allocation. |
| Schema agent | Only the three test-administrator rows in `source/domain/schema/schema.sql`, plus the stale seed-email comment in `source/devops/scripts/db-genesis-verify.ts`; consumes and removes the temporary ID pool.                    |
| Tests agent  | New stage configuration/session fixture and offline verification tests within `source/tests/`, plus `users-api-test.ts` session wrapping and its contradictory status assertion; no live execution.                            |
| Coordinator  | Read-only integration review, preservation checks, offline checks, and final verification.                                                                                                                                     |

B-33 records only the missing backend authority in the genesis prompt. The prompt remains
unchanged, no generator is expanded, and no existing schema data, IDs, DDL, policy, function,
bootstrap identity, or unrelated seed is modified. There are no changes to `deno.jsonc`, secrets,
live resources, deployment artifacts, or authentication methods. No git writes are performed.
The service key remains in setup; test calls use the public client's administrator session through
real RLS and edge authorization. Stage-only is a stated condition; P-11 settles future production
exclusion, with no target-filter mechanism added now.

### Verification status

Results are pending. The coordinator will inspect the exact three-row schema addition and shared
ID, verify existing schema and meaningful documentation content are preserved, check bootstrap,
identity mismatch and cleanup paths offline, and run the approved guards/type/lint/format checks
and restricted tests excluding both live-stage files. The CA's post-genesis stage execution is
explicitly not run by these agents. File results, failures, and STYLE_AUDIT follow in a named
amendment after verification; this brief remains active for CA/AA review and deployment authority.

## Amendment — 2026-10-23 — Foundation production results

**Implemented and coordinator-verified; CA genesis, live Users test, and review remain pending.**
This amendment supersedes the ledger's pending-check status. Foundation Mode was used for the
approved seed, configuration, authentication fixture, documentation, and test changes. No remaining
implementation blocker was found. The brief remains active: code production is not a claim that
stage has been reset, deployed, or tested live.

### Per-file results

Persistent inventory: **three created, eight modified, zero deleted**. The temporary ID pool and
its newly created directory were consumed and removed; neither remains in the final inventory.
No migration, task, credential file, genesis prompt, or unrelated source artifact changed.

| File                                                         | Result and preservation evidence                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `documentation/architecture/architecture-back.md`            | Modified §4.4 first to author the fixed active test administrator and shared auth/domain ID; replaced stale seed-upsert semantics with total-reset semantics. Existing document title/header and unrelated content preserved.                                                                                                                                                                     |
| `documentation/architecture/architecture-devops.md`          | Modified §§12.2–12.3 to describe total auth deletion/plain seed inserts, add the zero instance_id example, and distinguish four non-null empty-string fields from the non-null confirmation timestamp. Added §12.4 for stage configuration, setup-only service key, public session, identity check, cleanup, and CA-run commands. Existing header and all five auth-field requirements preserved. |
| `effort/active/2026-10-13-stage-test-authorization-brief.md` | Modified only by named production-ledger/results amendments. The CA-amended opening framing and prior decision history were preserved against the pre-production HEAD.                                                                                                                                                                                                                            |
| `effort/project/project-backlog.md`                          | Added B-33 for the genesis prompt's missing backend authority. Original header and existing entries preserved; no prompt or generator expansion performed.                                                                                                                                                                                                                                        |
| `source/domain/schema/schema.sql`                            | Added exactly three rows: auth user, email identity, and domain user for test-admin@swarmag.com with UUID 01a1679c-be97-76f3-befc-8dd3e23161ab. Static reconstruction confirms every pre-existing schema byte, row, ID, policy, function, and DDL statement is unchanged after removing only the three additions. Original schema header preserved.                                               |
| `source/devops/scripts/db-genesis-verify.ts`                 | Updated only the obsolete email-preserving-upsert comment to current total-genesis meaning. Executable content and original header are unchanged.                                                                                                                                                                                                                                                 |
| `source/tests/cases/users-api-test.ts`                       | Uses stage-config and StageSession.run around real CRUD; corrected inactive-status assertion to match the active update. Original CRUD-purpose statement survives alongside the box/session description. Live execution was not performed.                                                                                                                                                        |
| `source/tests/cases/session-coordinator-test.ts`             | Updated bootstrap/execution wording truthfully; retains session-eligibility purpose, stubs, and service-key-free shared configuration. Independently ran four tests offline without network permission.                                                                                                                                                                                           |
| `source/tests/config/stage-config.ts`                        | Created stage-specific configuration entry point. Registers the four shared keys and SUPABASE_SERVICE_ROLE_KEY, exposes SUPABASE_SERVICE_KEY through the established alias, and rejects non-edge mode before public-client creation. Shared test-config remains unchanged. New file; no baseline header existed.                                                                                  |
| `source/tests/fixtures/stage-session.ts`                     | Created StageSession.id/email/run. Only the ephemeral service client mints the token; public API client redeems it, validates the fixed seed ID, runs the callback, and performs session-local sign-out. Callback/setup errors survive; simultaneous cleanup failure is reported with both errors in AggregateError. New PURPOSE/PUBLIC header documents its contract.                            |
| `source/tests/cases/stage-session-test.ts`                   | Created mocked transport coverage for correct identity/public-client attachment, mismatch blocking, callback failure cleanup, cleanup rejection, and simultaneous callback/cleanup errors. No live service calls; new case header documents the offline test.                                                                                                                                     |

The fixed seed was authored in backend documentation before schema/test implementation. The pool
contained one published UUID allocated with core `id()`; its failed initial unpersisted allocation
attempt is recorded in the ledger. Schema consumption, pool deletion, and removal of the temporary
directory were verified. B-33 remains future work: the genesis prompt itself is unchanged.

### Verification and failures fixed

The coordinator's forensic review confirmed exactly three added schema rows with one fixed shared
ID and byte-identical pre-existing schema; verifier executable content was unchanged. Header
content was compared against `56edb05`: backend/DevOps/backlog/schema/verifier headers are identical;
Users retains its original CRUD purpose; coordinator retains session eligibility with resolved
bootstrap wording updated to current truth. This brief's existing CA-amended opening was preserved
against pre-production HEAD. The three new TypeScript files have no baseline and were audited for
current box, PURPOSE/PUBLIC, and applicable case-file conventions.

An initial lint run found `no-unsafe-finally` in the new session fixture. The in-scope repair
captures the operation outcome and cleanup outcome separately, then reports failures after the
finally block. The callback/setup error is preserved, and a combined failure retains both causes
in AggregateError. A fifth mocked step proves that case. Collection/scalar/object naming
corrections were also made before the final full check passed. No check failure remains.

| Check                                                                                                 | Coordinator result                                                        |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `deno task check`                                                                                     | PASS, exit 0; all guards, full type checking, 255 files linted.           |
| `deno task fmt:check`                                                                                 | PASS, exit 0.                                                             |
| `git diff --check`                                                                                    | PASS, exit 0.                                                             |
| Restricted offline suite, excluding users-api-test.ts and session-coordinator-test.ts                 | PASS, 122 tests and five nested steps, zero failures.                     |
| session-coordinator-test.ts separately with four inert shared environment values, without --allow-net | PASS, four tests, zero failures; no service key or live session required. |
| Static schema/ID/verifier/header preservation review                                                  | PASS, as detailed above.                                                  |

The restricted suite command was:

```bash
deno test --allow-env --allow-net --allow-read --ignore=source/tests/cases/users-api-test.ts,source/tests/cases/session-coordinator-test.ts "source/tests/**/*-test.ts"
```

No source changes followed the final checks. The record amendment was formatted separately and
checked for whitespace errors. Boundary checks used `git status --porcelain -uall` throughout.

**STYLE_AUDIT: PASS** — audited the seven code/schema files and four documentation/effort files
listed above for this authorized scope, including names, headers, imports, comments, and preserved
seed/session contracts. This does not claim correction of unrelated repository backlog findings.

### Not performed and remaining authority

No live Users test, genesis application, deployment, live SQL, credential read, email delivery,
git write, or stage write was performed. The service key was never used for test API calls.
The CA must separately apply genesis to stage and run the documented live Users test before
live-stage authorization behavior can be claimed. Mocked tests establish setup behavior, not live
Supabase/RLS/edge success. Future production seed exclusion remains P-11; prompt authority repair
remains B-33. No new implementation question requires scope expansion.

Production and offline verification are ready for independent final review and CA review. This
brief remains **active** until the required live validation, review, and closure conditions are
satisfied; no move or closure is performed by this report.

## Amendment — 2026-10-23 — Offline review confirmation

Independent code review by the schema agent found the new session setup/cleanup code unblocked.
This is supporting implementation review; live stage behavior remains unverified and CA/AA review
and CA-run genesis/live validation remain outstanding. The documented stage command in DevOps
§12.4 was wrapped with shell continuations without changing its invocation; no source code changed.

## Closure (2026-10-23)

Production by the AI Coding Engine (`1490f26`); the AI Architect verified the diff against the
scope: `schema.sql` gained only the three seed rows, the locked documents changed only in their
opened sections, `db-genesis-verify.ts` only in its comment, and no credential is committed. Checks
passed. The first genesis failed on `user_has_access`, whose parameter rename (`0dc1185`) `CREATE OR
REPLACE` cannot apply; `schema.sql` now drops the function before recreating it (`27d13e1`). The CA
then ran genesis on stage, `db-genesis-verify` passed, and the acceptance check passed:
`users-api-test.ts` (full CRUD lifecycle, signed in as the test administrator) and
`session-coordinator-test.ts` (four tests), 5 passed and none failed.

Settled at closure:

- **"ACE review resolved" item 2 overstated the genesis prompt.** Its authority set does not include
  `architecture-back.md`, so documentation leading the seed does not yet make it regenerable. That
  gap, and the missing rule to drop functions, are B-33.
- **Production seed exclusion:** parked as P-11.
- **Assembling stage configuration** took five variables from three places, two of them behind
  placeholders: B-34.

This was M-5's last enabler.

_End of Brief_
