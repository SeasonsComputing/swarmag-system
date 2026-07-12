# Edge Functions Remediation — Task List

**Date:** 2026-07-12
**Mode:** Foundation
**Status:** Phase 1 complete; Phases 2–6 pending
**Source design:** `documentation/project/2026-07-12-edge-functions-remediation-design.md`

This task list decomposes the approved design (D1–D9) into gated phases. Each
phase is one authorized production with its own checks.

## Phase 0 — Decisions

- [x] D1–D7 approved by Chief Architect (2026-07-12)
- [x] D8 adapter patch semantics ratified
- [x] D9 shared edge handshake approved
- [x] `login.tsx` retrofitted to `api.Users.hasAccess(email)` (CA, pre-phase)

## Phase 1 — Foundation Doc Deltas _(complete 2026-07-12)_

- [x] `architecture-back.md`
  - [x] §2 tree adds `orchestration/`
  - [x] §3.3 two-client model replaces `Supabase.client()` singleton bullet
  - [x] §3.4 authoring vs. deployment layout with `Deno.serve` shim pattern (D2)
  - [x] §4.5 id rule via `@core/std` `id()` (D1)
  - [x] §4.6 users read-only paragraph (D7), auth-first ordering (D4),
        compensation rethrow, eject reactivation-unsupported (D5)
  - [x] §5.1 alias-map config sample; `SUPABASE_CLIENT_MODE` dropped (D3)
  - [x] §7.1 real deploy workflow (`config.toml [functions.*]`, `verify_jwt`,
        root import map, `functions serve`)
- [x] `architecture-core.md`
  - [x] §3.2.3 flat authoring decoupled from platform discovery
  - [x] §3.2.4 import-map wiring via `config.toml`; snippet synced to `deno.jsonc`
  - [x] §6.3.1 backend config example in alias form
  - [x] §8 trees add `core/service/` and `orchestration/`
  - [x] §10.1.7 invariant updated
- [x] `architecture-devops.md`
  - [x] §4.4 logical-name → platform-injected-name binding table (D3)
  - [x] §13.3 OTP-never-provisions paragraph (D6)
- [x] Stale example import paths fixed (`supabase-config.ts`, `ux-config.ts`)

## Adapter Null Semantics — D8 _(complete 2026-07-12)_

- [x] `core/std/make-adapter.ts` — falsy write-through, null clears,
      storage NULL → domain absence; `AdapterPatch` admits null
- [x] `core/std/protocols.ts` — `UpdateFromInstantiable` via `Clearable`
      (null on optional attributes only)
- [x] `core/std/validators.ts` — all `expect*` optional guards admit null
- [x] `core/std/adt.ts` — `isNullish` exported; reused by validators and adapter
- [x] Unit tests: `source/tests/cases/make-adapter-test.ts`,
      `source/tests/cases/validators-test.ts` (7/7 passing)

## Phase 2 — Shared Edge Foundation

- [ ] `core/std/wrap-http-handler.ts` — `HttpCodes` gains `unauthorized: 401`,
      `forbidden: 403`, `conflict: 409`; orchestration local constants removed
- [ ] `core/client/make-supabase-client.ts` — edge client reads error
      `Response` body (`await error.context.json()`) so server messages reach UX
- [ ] `core/client/auth-supabase-client.ts` — `sendOtp` passes
      `shouldCreateUser: false` (D6)
- [ ] `back/supabase-edge/config/supabase-config.ts` — alias form per D3
- [ ] NEW `core/service/edge-auth.ts` — `makeEdgeAuth(spec)` / `verifyCaller`
      per D9
- [ ] Import path consistency: `@core/stdx` barrel in `core/service`

## Phase 3 — Orchestration Fixes and Deployment Seam

- [ ] `orchestration/user-management.ts`
  - [ ] Auth-first ordering for delete/eject (D4)
  - [ ] Domain writes via `serviceClient` (D7)
  - [ ] Compensation failure logs and rethrows original error
  - [ ] `authorizeAdmin` uses `makeEdgeAuth.verifyCaller`; missing caller row → 403
  - [ ] Honest auth-admin status mapping (422 input, 409 only for conflicts)
- [ ] Committed shims: `supabase/functions/{user-create,user-update,user-delete,user-eject}/index.ts`
- [ ] `supabase-import-map.json` at repository root, synced with `deno.jsonc`
- [ ] `supabase/config.toml` — `[functions.*]` blocks (`import_map`,
      `verify_jwt = true`); `enable_signup = false` (D6)
- [ ] Trim `back-supabase-edge-{target}.env.example` templates per D3

## Phase 4 — Schema / RLS

- [ ] `source/domain/schema/schema.sql` — drop `users_insert_all`,
      `users_update_all`, `users_delete_all`; scope select `TO authenticated` (D7)
- [ ] `deno task db-reset --target dev` + verify
- [ ] `deno task db-reset --target stage` + verify

## Phase 5 — Validate, Deploy, Verify

- [ ] `deno task check` green
- [ ] `supabase functions serve` — local runtime proof of the seam
- [ ] Deploy 4 functions to dev; scripted round-trip integration test
      (admin JWT via `auth.admin.generateLink`; create → update(email) →
      eject → delete; assert UUID invariant each step) added to `source/tests/`
- [ ] Deploy to stage; re-run round-trip; manual app-admin User Manager pass

## Phase 6 — Close-out

- [ ] Backlog: ban-based eject alternative, `user-reinstate`, shim generator,
      edge smoke in deploy pipeline, literals-invariant doc note
- [ ] Commit strategy per CA; return to Customer Onboarding milestone

_End of Task List_
