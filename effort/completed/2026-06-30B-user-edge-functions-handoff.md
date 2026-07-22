# User Edge Functions — Architecture-First Handoff

**Date:** 2026-06-30
**Mode:** Foundation
**Purpose:** New-session handoff focused only on user edge functions and the first deliberate application of Supabase Edge as a server-side execution dimension.

## 1. Governing Context

- Invariants: `AGENTS.md`
- Required session context:
  - Base context
  - Domain Internals
  - DevOps
  - Application Features
- Working checklist: `effort/completed/2026-06-28-user-contact-customer-tasks.md`
- Prior broad handoff: `effort/completed/2026-06-30A-user-contact-customer-handoff.md`

This scope is Foundation work. It touches shared backend architecture, DevOps
configuration, Supabase Edge runtime assumptions, auth/domain synchronization,
and the UX API topic boundary for Users.

## 2. What Is Settled

- `user-create` must be added with `user-update`, `user-delete`, and `user-eject`.
- The UUID invariant is already settled:
  - `auth.users.id = public.users.id`
  - the UUID is application-supplied UUID v7
  - the database must not generate the domain user ID
- The new edge-function work is primarily **attribute synchronization**, not UUID synchronization.
- The key attribute synchronization case is email:
  - if `public.users.primary_email` changes, `auth.users.email` must change so OTP still works.
- `api.Users` is the correct abstraction boundary.
  - Callers should not know whether a User operation uses direct Supabase CRUD, RPC, or Edge Functions.
  - `makeAuthUsers()` exists to hide those synchronization details.
- `api.Users.hasAccess()` is the preferred API shape.
  - Remove the top-level `api.userHasAccess` concept when this scope is implemented.
  - The implementation may still use the existing `user_has_access` RPC internally.
- `api.Users.eject()` should exist on the returned Users contract.
- User edge functions are authenticated user-invoked operations, not open endpoints.
- Authentication alone is insufficient.
  - The function must verify the caller.
  - The function must check caller authorization, expected to be active administrator, before privileged user-management work.

## 3. Key Architectural Distinction

Do not conflate these two Supabase access use cases:

### Browser / UX Calling Edge

- UX calls through the browser Supabase client.
- Use existing Supabase library calls such as `Supabase.client().functions.invoke(...)`.
- The browser has only public client credentials and the current user's JWT.
- No service-role key enters UX config or browser bundles.
- This is the path for `api.Users.create`, `api.Users.update`, `api.Users.delete`, and `api.Users.eject`.

### Edge Function Accessing Supabase

- Runs server-side inside Supabase Edge.
- Reads server-side Supabase secrets from the Edge runtime.
- Uses the service-role key only for privileged orchestration such as `auth.admin.*`.
- May also use caller-scoped access to verify the current authenticated user.
- Must not depend on UX `VITE_*` config names.

## 4. Known Unknowns

This is the first real use of Supabase Edge as an application execution surface.
Be deliberate.

- `Config` is proven in Deno, Netlify, and Solid/browser contexts.
- `SupabaseProvider` is not yet proven in a real Supabase Edge runtime.
- The current provider assumes `globalThis.Supabase.env.get(key)`.
- Current Supabase Edge docs commonly show `Deno.env.get(key)`.
- Do not assume the provider is correct until it is verified or intentionally updated.
- Current backend edge env examples use `SUPABASE_URL`.
- Current `source/back/supabase-edge/config/supabase-config.ts` expects `SUPABASE_RDBMS_URL`.
- That mismatch must be resolved architecturally before implementation.
- The service-key env name is not yet settled in code:
  - Possible repo-local convention: `SUPABASE_SERVICE_KEY`
  - Possible Supabase-native convention: service-role naming
  - Settle this in `architecture-devops.md` before coding against it.

## 5. Architecture Updates Required First

Do not start implementation by writing edge functions.

First update:

- `documentation/architecture/architecture-devops.md`
- `documentation/architecture/architecture-back.md`

### DevOps Architecture Must Define

- Supabase Edge as a server-side execution dimension.
- Browser-to-edge invocation.
- Edge-to-Supabase access.
- Edge runtime configuration names.
- Edge secret ownership and platform-managed secret expectations.
- Service-role key boundary:
  - edge-only
  - never UX
  - used only for privileged orchestration
- Whether `SupabaseProvider` reads from `Deno.env.get` or another runtime API.
- How backend edge env examples should be named and validated.

### Backend Architecture Must Define

- User auth attribute synchronization.
- `user-create`
- `user-update`
- `user-delete`
- `user-eject`
- Caller verification and administrator authorization.
- Domain soft-delete versus auth revocation.
- Eject semantics:
  - revoke auth access
  - preserve domain history
  - likely set `public.users.status = 'inactive'`
- Create failure compensation:
  - if Auth user creation succeeds and public row insert fails, delete the Auth user.

## 6. Proposed Code Shape After Architecture Is Settled

### UX API

`source/ux/api/api.ts` should become tighter:

```typescript
export const api = {
  Auth: AuthSupabaseClient,
  AppState,
  SessionState,
  Users: makeAuthUsers()
}
```

`source/ux/api/make-auth-users.ts` should return an expanded Users contract:

```typescript
type AuthUsersContract = ApiCrudContract<User> & {
  eject(id: Id): Promise<User>
  hasAccess(input: { email: string }): Promise<boolean>
}
```

Implementation shape:

- `get` and `list`: direct Supabase table client.
- `hasAccess`: existing `user_has_access` RPC hidden inside `makeAuthUsers()`.
- `create`, `update`, `delete`, `eject`: `Supabase.client().functions.invoke(...)`.

No hand-written browser fetch plumbing should be introduced unless `functions.invoke` fails a concrete requirement.

### Edge Functions

Expected files:

- `source/back/supabase-edge/functions/user-create.ts`
- `source/back/supabase-edge/functions/user-update.ts`
- `source/back/supabase-edge/functions/user-delete.ts`
- `source/back/supabase-edge/functions/user-eject.ts`

If shared support is needed, keep it outside the flat deployable functions directory, for example:

- `source/back/supabase-edge/user-auth-support.ts`

Do not place helper-only files under `source/back/supabase-edge/functions/` unless platform discovery is confirmed not to treat them as deployable functions.

## 7. Function Semantics

### `user-create`

- Caller must be authenticated and authorized.
- Validate `UserCreate`.
- Create `auth.users` with the application-supplied domain ID.
- Insert `public.users`.
- If public insert fails after auth creation, delete the Auth user as compensation.
- Return `User`.

### `user-update`

- Caller must be authenticated and authorized.
- Validate `UserUpdate`.
- Update `public.users`.
- If `primaryEmail` is present or changed, update `auth.users.email`.
- Return `User`.

### `user-delete`

- Caller must be authenticated and authorized.
- Soft-delete `public.users`.
- Delete or revoke the matching Auth identity.
- Return `DeleteResult`.

### `user-eject`

- Caller must be authenticated and authorized.
- Delete or revoke the matching Auth identity.
- Preserve `public.users` history.
- Set `public.users.status = 'inactive'`.
- Return `User`.

## 8. Suggested Implementation Sequence

1. Read `documentation/architecture/architecture-devops.md` and `documentation/architecture/architecture-back.md`.
2. Update those docs first.
3. Update the task list if architecture decisions shift.
4. Update or confirm `SupabaseProvider`.
5. Reconcile backend edge env examples and config names.
6. Run env and architecture guards.
7. Implement `makeAuthUsers()` contract changes.
8. Update call sites from `api.userHasAccess.run(...)` to `api.Users.hasAccess(...)`.
9. Implement edge support helper if needed.
10. Implement `user-create`, `user-update`, `user-delete`, `user-eject`.
11. Run targeted `deno check`.
12. Run `deno task check`.
13. Update handoff/task docs with final decisions and checks.

## 9. Checks To Run

Minimum local checks:

- `deno task guard:env`
- `deno task guard:architecture`
- targeted `deno check` for changed edge and UX API files
- `deno task check`
- `dprint fmt` for changed documentation

Later environment checks:

- Deploy functions to an approved Supabase target.
- Verify authenticated invocation from a stage-bound Admin app.
- Verify attribute synchronization through OTP after email change.
- Verify `user-eject` prevents OTP while preserving the domain user row.

## 10. Out Of Scope

- Customer Onboarding.
- CustomerUser API/client exposure.
- RLS redesign.
- From-scratch genesis deployment.
- Netlify app deployment.
- New User Management UX beyond API wiring.

## 11. Cautions

- Do not use service-role secrets in UX config or browser code.
- Do not treat user edge functions as public endpoints.
- Do not implement edge functions before documenting the new DevOps architecture dimension.
- Do not assume `SupabaseProvider` is correct in Edge until verified.
- Do not rename `JobPlanAssignmentRole`.
- Do not reintroduce embedded `Contact`.
- Do not encode the open Customer primary-contact membership decision in this scope.
