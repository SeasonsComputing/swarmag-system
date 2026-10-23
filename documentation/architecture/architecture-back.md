<img src="../../swarmag-ops-logo.png" title="" alt="swarmAg Operations System" data-align="center">

# swarmAg Operations System — Architecture Backend

## 1. Overview

This document defines the backend architecture of the swarmAg system. The backend consists of:

- **Supabase Edge Functions** — Orchestration operations only
- **PostgreSQL Database** — Persistent storage with Row Level Security
- **Storage Buckets** — File and image storage
- **Migrations** — Forward-only schema deltas and RLS policy changes

## 2. Directory Structure

The backend layer is intentionally minimal, consisting of forward-only migrations and flat orchestration functions.

```text
back/
├── migrations/          # Forward-only schema deltas and RLS policies
└── supabase-edge/
    ├── config/          # Runtime configuration
    ├── functions/       # Flat orchestration functions (authoring layout)
    └── orchestration/   # Shared orchestration modules for edge functions
```

## 3. Supabase Edge Functions

The backend is intentionally minimal. Most operations go **directly to the database** from UX applications via Supabase SDK. Edge functions exist only for orchestration that cannot be expressed as simple CRUD.

**Key Principle: If it can be a direct database operation with RLS, it shouldn't be an edge function.**

Edge functions handle **orchestration only** — complex multi-step operations that cannot be performed client-side.

### 3.1 When to Use Edge Functions

#### 3.1.1 YES — Use edge functions for

- Multi-step transactions requiring coordination (e.g. deep clone Job aggregate)
- Operations with complex business rules spanning multiple tables
- Background processing or async workflows
- Operations requiring elevated privileges

#### 3.1.2 NO — Do NOT use edge functions for

- Simple CRUD operations (use direct Supabase SDK client)
- Read-only queries (use direct Supabase SDK client)
- Client-side validation (use domain validators)
- General application authorization that belongs in RLS policies

Privileged orchestration is the exception to the final rule. When an edge
function uses elevated credentials, the function must verify the authenticated
caller and perform the required domain authorization check before privileged
work begins. RLS remains authoritative for direct database access; service-role
orchestration must not become an open bypass.

### 3.2 Edge Function Patterns

A function is either one business-rule operation wrapped with `wrapBusRuleHttpHandler`, or a
handler needing full HTTP control wrapped with `wrapHttpHandler`. CONVENTIONS §12 says when to use
each.

### 3.3 Function Responsibilities

Edge functions **do**:

- Orchestrate multi-step operations
- Use two Supabase clients with distinct responsibilities: a caller-scoped
  client (public key plus forwarded caller Authorization header) for reads
  where RLS should apply, and a service-role client for privileged
  orchestration (`auth.admin.*`) and for domain writes that RLS intentionally
  grants to no direct caller
- Use domain adapters for serialization
- Use domain validators for input validation
- Verify the caller and check required authorization before privileged work

Edge functions **do not**:

- Contain business logic (that lives in domain)
- Replace RLS for ordinary database authorization
- Duplicate CRUD operations (use direct SDK)
- Expose open endpoints for authenticated user-management operations

### 3.4 Function Layout: Authoring vs. Deployment

**Authoring layout** (repository source of truth):

- Stay flat in `source/back/supabase-edge/functions/` — no subdirectories
- Single file per function; filename = function name
- Shared orchestration logic lives in `source/back/supabase-edge/orchestration/`

**Deployment layout** (Supabase platform requirement):

Supabase edge tooling mounts only `supabase/functions/` into its runtime
container — function imports cannot reach `source/`. The platform discovers
functions as `supabase/functions/{name}/index.ts` served via `Deno.serve`.
Each function therefore has:

- A committed entrypoint shim bridging the authoring layout to the platform:

```typescript
// supabase/functions/user-create/index.ts
import handler from '@back/supabase-edge/functions/user-create.ts'
import { wrapSupabaseShim } from '@core/svc/wrap-supabase-shim.ts'

Deno.serve(wrapSupabaseShim(handler))
```

- A generated per-function `deno.json` declaring the alias imports into
  `_shared/` — the Deno 2 edge runtime resolves function dependencies from
  this file (the `config.toml` `import_map` key is not honored by `serve`).
  `edge-sync` derives it for every function directory from the committed
  `supabase/functions/import_map.json`, the single source of truth.

Shims contain no logic. All behavior lives in the authored function files,
which reach the runtime through `supabase/functions/_shared/` — a generated,
gitignored copy of the `source/core`, `source/domain`, and
`source/back/supabase-edge` trees produced by `deno task edge-sync`. Deleting
`_shared` loses nothing; it is regenerable infrastructure (see section 7.1).

## 4. Database Layer

### 4.1 Schema vs. Migrations

The canonical schema lives in `source/domain/schema/schema.sql` — a domain archetype generated from the domain model. It is the authoritative current-state DDL for the entire system. It is not a migration.

See `domain-archetypes.md` section 7 for all DDL authoring conventions.

Migrations in `source/back/migrations/` are forward-only change records expressing deltas from one schema state to the next. **Do not define the schema in migrations.** The schema file is the source of truth; migrations derive from it.

### 4.2 Migration Rules

Migrations follow CONVENTIONS §14.3.

### 4.3 Row Level Security

Authorization is enforced at the **database layer** via RLS policies, not application code.

#### 4.3.1 Policy Pattern

```sql
CREATE POLICY "job_logs_select_own"
ON job_logs FOR SELECT
USING (created_by_id = auth.uid());

CREATE POLICY "job_logs_insert_ops"
ON job_logs FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'operations');
```

#### 4.3.2 RLS Principles

- Policies defined in `schema.sql` alongside their tables — canonical current state
- Migrations express RLS deltas (policy changes, additions, removals)
- Cannot be bypassed by client code
- Automatic enforcement across all access paths
- Tested via integration tests with different user contexts

### 4.4 Seed Data

Canonical seed data known at schema time is part of `schema.sql` — not a migration. The following seed data is defined in `schema.sql`:

- **Asset types** — canonical `asset_types` records from `domain-seed-data.md §4`
- **Services** — canonical `services` records from `domain-seed-data.md §2` and `§3`
- **Internal questions** — canonical `questions` seed records with `QuestionType = 'internal'` from `domain-seed-data.md §5`
  - **Bootstrap admin user** — `devops-admin@swarmag.com` with `administrator` role and stable UUID; authenticates via the same passwordless OTP flow as every other user. No password is ever set for this or any account: Supabase provides no config toggle to disable password-grant login, so the passwordless invariant is enforced entirely by the absence of any password-setting code path in this system. Never set a password for any user via the Supabase dashboard or Auth admin API — doing so creates a login path that bypasses `sendOtp`, `shouldCreateUser: false`, and every edge-function authorization check, and is indistinguishable from an OTP-issued session at the RLS layer.
- **Stage test administrator** — `test-admin@swarmag.com`, display name `Test Administrator`,
  stable UUID v7 `01a1679c-be97-76f3-befc-8dd3e23161ab`, with role `administrator`, status `active`,
  and no deletion timestamp. Genesis seeds this identity beside the bootstrap administrator in
  `auth.users`, its email-provider `auth.identities` row, and `public.users`, sharing the same fixed
  ID across all three. It uses the same confirmed-email, non-null auth-field conventions as the
  bootstrap administrator and has no password. Tests mint and redeem an email sign-in token in
  setup, assert the redeemed user ID matches this seed, then use that user's public-client session
  for real RLS and edge authorization. The service key is setup-only, never a test-call credential.
  The dedicated identity makes automated writes attributable. It belongs to stage: genesis has
  one schema for every target, and stage is the only environment today; excluding this seed from
  a future production genesis remains the P-11 decision, not an implemented target switch.

All seed record IDs are stable UUID v7 values drawn from `source/devops/genesis/seed-ids.txt`. No seed record uses a database-generated ID.

**Genesis is a total reset of authentication and domain data.** The canonical schema deletes
all existing `auth.users` rows, allowing their dependent identity/session rows to be removed, and
recreates the documented auth seeds and their email identities alongside the recreated public
schema. There is no email-preserving seed upsert. A genesis run therefore replaces user state,
including changed seed emails, with current seed authority; it is not a migration or a way to
preserve live accounts. `db-genesis-verify` checks the resulting bootstrap identity and auth/domain
email agreement without choosing or repairing divergent values.

### 4.5 Auth / Domain User Boundary

There is one domain `User`.

Supabase represents that single user across two backend structures with different responsibilities.
`auth.users` is the authentication principal and Supabase security anchor. `public.users` is the
domain user record queried, validated, adapted, and related by the application.

The two records intentionally share the same UUID v7, generated by application
code via `@core/std` `id()`. This keeps
authentication, RLS, and domain relationships aligned without introducing a translation layer
between auth identity and domain identity.

Backend user creation, update, delete, and eject paths must preserve this boundary. The domain
user ID is a UUID v7 generated by `@core/std` `id()` at the point where creation executes, and
every backend path that creates or synchronizes auth/domain user state must reuse that single
UUID for both `auth.users.id` and `public.users.id`. The database must never generate the
domain user ID.

The settled synchronization problem for user edge functions is attribute
synchronization, not UUID synchronization. The UUID invariant already exists:
`auth.users.id = public.users.id`. User edge functions preserve that invariant
while synchronizing mutable authentication attributes when domain user
attributes change.

The primary attribute synchronization case is email. When
`public.users.primary_email` changes through the user-management API,
`auth.users.email` must be updated so passwordless OTP continues to target the
same domain user.

### 4.6 User Management Edge Functions

User creation, update, delete, and eject require Supabase Auth admin operations
and therefore run through authenticated Supabase Edge functions. They are
user-invoked privileged operations, not open endpoints.

The `users` table is read-only to direct callers. Its RLS grants `SELECT` to
authenticated users, including soft-deleted rows, and defines no `INSERT`,
`UPDATE`, or `DELETE` policies for any direct caller. All domain user writes
flow through these edge functions via the service-role client after
administrator authorization.

`get` returns a soft-deleted User with `deletedAt` set so existing
references can resolve it. API lists exclude deleted Users; RLS does not
enforce that list filter. Liveness checks, including session eligibility,
follow `architecture-core.md` §3.2.5. User-management orchestration and
`user_has_access` retain their deletion filters for write and authorization
paths.

Every user-management edge function must:

1. Require an authenticated caller JWT.
2. Resolve the caller's domain `User`.
3. Require the caller to be active and have the `administrator` role.
4. Validate the request payload with the domain validator for the requested
   operation.
5. Use the caller-scoped client for ordinary domain reads where RLS should
   apply.
6. Use the service-role client for privileged orchestration (`auth.admin.*`)
   and for domain user-row writes, which RLS grants to no direct caller.
7. Return a typed API response without exposing internal error details.

The required edge functions are:

| Function      | Request      | Response       | Semantics                                                        |
| ------------- | ------------ | -------------- | ---------------------------------------------------------------- |
| `user-create` | `UserCreate` | `User`         | Create Auth user, then create `public.users`; compensate on fail |
| `user-update` | `UserUpdate` | `User`         | Update `public.users`, then sync Auth email when it changes      |
| `user-delete` | `{ id: Id }` | `DeleteResult` | Delete Auth identity first, then soft-delete the domain user     |
| `user-eject`  | `{ id: Id }` | `User`         | Delete Auth identity first, then set status to `inactive`        |

`user-create` generates the user ID once via `@core/std` `id()` and uses it
for both `auth.users.id` and `public.users.id`. If Auth user creation succeeds
and domain row creation fails, the function must delete the Auth user as
compensation before returning an error. When compensation itself fails, the
function logs the compensation failure and rethrows the original error — a
compensation failure must never mask the root cause.

`user-delete` and `user-eject` revoke access before mutating domain state: the
Auth identity is deleted first, then the domain row is changed. Access
revocation is the security-relevant half of the operation and must not be the
half that silently fails.

`user-delete` is domain removal. It deletes the matching Auth identity, then
soft-deletes `public.users`. It returns the standard `DeleteResult` contract.

`user-eject` is access revocation without domain-history destruction. It
deletes the matching Auth identity, keeps the domain user row, sets
`public.users.status = 'inactive'`, and returns the updated `User`.
Reactivation is not supported: setting an ejected user back to `active` does
not restore an Auth identity. Restoring access requires a future
`user-reinstate` function.

## 5. Configuration Management

Edge functions use the runtime configuration pattern in CONVENTIONS §11; this system's packages
are listed in `architecture-core.md` §6.

### 5.1 Supabase Edge Function Configuration

The Supabase Edge runtime injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` automatically and reserves the `SUPABASE_` prefix
for its own names — custom secrets cannot use it. The configuration bootstrap
binds the repository's logical names to the platform-injected names through
the `Config` alias map. No custom Supabase secrets are required.

```typescript
// source/back/supabase-edge/config/supabase-config.ts
import { Config } from '@core/cfg/config.ts'
import { SupabaseProvider } from '@core/cfg/supabase-provider.ts'

Config.init(
  new SupabaseProvider(),
  ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  {
    SUPABASE_PUBLIC_KEY: 'SUPABASE_ANON_KEY',
    SUPABASE_SERVICE_KEY: 'SUPABASE_SERVICE_ROLE_KEY'
  }
)

export { Config }
```

Consuming code calls `Config.get('SUPABASE_PUBLIC_KEY')` and
`Config.get('SUPABASE_SERVICE_KEY')` — logical names, no platform knowledge.
See `architecture-devops.md §4.4` for the name-binding table.

### 5.2 Environment Files

See `architecture-devops.md §4` for naming conventions, placeholder contract, and security rules.

## 6. Testing Strategy

### 6.1 Integration Tests

- Test edge functions against the hosted dev or stage Supabase project
- Verify RLS policies enforce authorization correctly
- Test multi-user scenarios
- Located in `source/tests/`

### 6.2 Migration Tests

- Verify migrations apply cleanly
- Test RLS policies with different user contexts
- Automated via `supabase test db`

See `CONVENTIONS.md` §18 for general testing conventions.

## 7. Deployment

### 7.1 Supabase Edge Functions

Serve and deploy always run through the repository tasks, which refresh
`supabase/functions/_shared/` (`edge-sync`) and pin `TMPDIR` to a
Docker-VM-shared path before invoking the Supabase CLI:

```bash
deno task edge-serve                # sync, clean stale container, serve locally
deno task edge-deploy user-create   # sync, deploy one function (linked project)
```

Function registration lives in `supabase/config.toml`, one block per function:

```toml
[functions.user-create]
entrypoint = "./functions/user-create/index.ts"
import_map = "./functions/import_map.json"
verify_jwt = true
```

- `verify_jwt = true` keeps the platform gateway JWT check in front of every
  user-management function. The gateway check is transport authentication
  only — it never replaces caller verification and administrator authorization
  inside the function (section 4.6).
- Runtime alias resolution comes from each function's committed `deno.json`
  (section 3.4). `supabase/functions/import_map.json` carries the same map for
  CLI compatibility. Both are synchronized manually with `deno.jsonc`,
  restricted to what the edge function graph needs.

Local platform constraints, learned empirically and enforced by the tasks:

- The Supabase CLI stages runtime artifacts in `$TMPDIR` and bind-mounts them;
  Docker VMs that do not share `/var/folders` (e.g. Colima's defaults) see a
  phantom empty directory and the main worker fails to boot. The tasks pin
  `TMPDIR` to `build/tmp` under the repository, which is home-shared.
- A crashed `serve` leaves a stale `supabase_edge_runtime_*` container that
  blocks the next boot; `edge-serve` removes it before starting.

Every deployed function is its own platform application — its own worker,
module graph, and manifest. Build traceability therefore travels with the
bundle: `edge-sync` stamps `_shared` build metadata (`VERSION` line, git build
count, short SHA), and every function reply carries it in the
`x-swarmag-build` response header via the BusRule wrapper's static headers.

### 7.2 Database Migrations

```bash
supabase db push
```

Migration Safety:

- Verify migrations against the hosted Supabase project as a production release prerequisite. e.g. dev -> stage -> validate -> prod -> validate -> live
- Verify RLS policies in staging environment
- Never modify deployed migrations — create new ones

## 8. Security

### 8.1 Authentication

- JWT tokens issued by Supabase Auth
- Tokens verified automatically by Supabase SDK
- Edge functions access user context via `auth.uid()` in RLS

### 8.2 Authorization

- **Primary:** RLS policies enforce ordinary database access control
- **Secondary:** Edge functions validate inputs via domain validators
- **Privileged orchestration:** Edge functions using elevated credentials must
  verify the caller and enforce the required administrator authorization check
- **Never:** UX-layer authorization or open service-role endpoints

## 9. Key Principles

1. **Orchestration only** — Edge functions coordinate; they do not implement business logic
2. **RLS is authoritative** — Ordinary database authorization lives in RLS
3. **Privileged edge checks are mandatory** — Elevated orchestration verifies
   the caller and administrator authorization before service-role work
4. **Direct-to-DB preferred** — Only use edge functions when SDK client can't suffice
5. **Schema lives in domain** — `source/domain/schema/schema.sql` is the canonical current state
6. **Migrations are forward-only** — Express deltas only; never modify deployed migrations
7. **Functions stay flat** — No subdirectories (platform requirement)

_End of Architecture Backend Document_
