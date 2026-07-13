# Edge Functions Remediation — Task List

**Date:** 2026-07-12
**Mode:** Foundation
**Status:** Phases 0–3b complete (uncommitted); Phase 4 schema edit made
locally, db-reset runs pending; Phases 5–6 pending
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

## Phase 2 — Shared Edge Foundation _(complete 2026-07-12)_

- [x] `core/std/wrap-http-handler.ts` — `HttpCodes` gains `unauthorized: 401`,
      `forbidden: 403`, `conflict: 409`; orchestration local constants removed
- [x] `core/client/make-supabase-client.ts` — edge client reads error
      `Response` body (`await error.context.json()`) so server messages reach UX
- [x] `core/client/auth-supabase-client.ts` — `sendOtp` passes
      `shouldCreateUser: false` (D6)
- [x] `back/supabase-edge/config/supabase-config.ts` — alias form per D3
- [x] NEW `core/service/make-supabase-edge-auth.ts` — `makeSupabaseEdgeAuth(spec)` / `verifyCaller`
      per D9
- [x] Import path consistency: `@core/stdx` barrel in `core/service`
- [x] Unit tests: `source/tests/cases/make-supabase-edge-auth-test.ts` (401 paths, 3/3 passing)

## Phase 3 — Orchestration Fixes and Deployment Seam

- [x] `orchestration/user-orchestra.ts` _(complete 2026-07-12)_
  - [x] Auth-first ordering for delete/eject (D4), with existence check before
        revocation and 404-tolerant revoke (supports eject → delete)
  - [x] Domain writes via `serviceClient` (D7); caller client retained for
        RLS-scoped caller resolution
  - [x] Compensation failure logs and rethrows original error
  - [x] `authorizeAdmin` uses `makeSupabaseEdgeAuth.verifyCaller`; missing caller row → 403
  - [x] Honest auth-admin status mapping (`statusFromAuth` passes provider status)
- [x] Committed shims: `supabase/functions/{user-create,user-update,user-delete,user-eject}/index.ts`
- [x] ~~`supabase-import-map.json` at repository root~~ superseded by D10:
      deleted; per-function `deno.json` + `supabase/functions/import_map.json`
- [x] `supabase/config.toml` — `[functions.*]` blocks (`entrypoint`,
      `import_map`, `verify_jwt = true`); `enable_signup = false` at `[auth]`
      and `[auth.email]` (D6)
- [x] Trim `back-supabase-edge-{target}.env.example` templates per D3

## Phase 3b — Mount Boundary + Local Runtime Repair (D10) _(complete 2026-07-13)_

- [x] `source/devops/scripts/edge-sync.ts` + `deno task edge-sync` — generated
      gitignored `supabase/functions/_shared/{core,domain,back}`
- [x] Per-function `deno.json` ×4 (Deno 2 runtime dependency resolution)
- [x] `deno task edge-serve` / `edge-deploy` — TMPDIR pinned to `build/tmp`
      (Colima does not share `/var/folders`); stale container cleanup
- [x] REPAIR `core/cfg/supabase-provider.ts` — env via `Deno.env.get()`;
      the assumed `Supabase.env` global does not exist
- [x] STYLE-GUIDE §3.2 barrel table path typo (`core/stdx` → `core/std`)
- [x] Local runtime proof: all four functions serve and return the
      orchestration's 401 envelope for anon callers (Phase 5 item satisfied
      early for local)
- [x] Per-function `deno.json` generated by `edge-sync` from committed
      `import_map.json` (single source of truth; manifests gitignored)
- [x] Build traceability: `edge-sync` stamps `build-meta.ts`
      (`{VERSION}.{git-count}+{sha}`); BusRule wrapper gains static `headers`
      spec option; all four functions reply with `x-swarmag-build`
      (verified live: `x-swarmag-build: 0.1.750+aeb7e7e` on a 401)

## Phase 4 — Schema / RLS

- [x] `source/domain/schema/schema.sql` — drop `users_insert_all`,
      `users_update_all`, `users_delete_all`; scope select `TO authenticated` (D7)
      _(edited locally, uncommitted; not yet applied to any target)_
- [ ] `deno task db-reset --target dev` + verify (blocked: Supabase CLI auth
      resolved 2026-07-13; run pending)
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
