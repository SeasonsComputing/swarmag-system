# Edge Functions Remediation — Task List

**Date:** 2026-07-12
**Mode:** Foundation
**Status:** CLOSED — Phases 0–6 all complete. No hosted dev project exists
(solo, pre-release team) — decisions and phases below ran against **stage
only**. See the Phase 5 Addendum below for D12, a real defect that Phase 5's
original manual pass did not catch.
**Source design:** `effort/completed/2026-07-12-edge-functions-remediation-design.md`

This task list decomposes the approved design (D1–D11) into gated phases. Each
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
        root import map, `functions serve`) — import-map detail superseded by
        D10, see Phase 3b
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

## Phase 4 — Schema / RLS _(complete 2026-07-13, stage only)_

- [x] `source/domain/schema/schema.sql` — drop `users_insert_all`,
      `users_update_all`, `users_delete_all`; scope select `TO authenticated` (D7)
- [x] Seed email corrected to match `architecture-back.md` §4.4:
      `devops-admin@swarmag.com` (was a temporary `tedvkremer@gmail.com` hack)
- [x] Supabase CLI auth resolved (stale PAT regenerated)
- [x] Topology confirmed via `list-supabase-targets`: no hosted dev project
      exists — solo pre-release team, stage is the only real target
- [x] `deno task db-reset --target stage` run (interactive confirmation;
      CA ran directly — `globalThis.prompt()` requires a real TTY, cannot be
      satisfied non-interactively, by design)
- [x] REPAIR `source/devops/scripts/db-genesis-verify.ts:157` — hardcoded
      stale `tedvkremer@gmail.com` in the `user_has_access` RPC check;
      corrected to `devops-admin@swarmag.com`
- [x] Independently verified live against `vpntxhqnwyudhiadsmtn` via Supabase
      MCP `execute_sql`: seed counts (asset_types=9, services=12,
      questions=14) correct; `user_has_access` RPC correct; exactly one
      policy on `users` (`users_select_active`, SELECT, `TO authenticated`) —
      the three open write policies are confirmed gone from the live database

## Phase 4 Addendum — Auth/Domain Email Drift (D11, complete 2026-07-13)

- [x] Incident found: seed email correction (`tedvkremer@gmail.com` →
      `devops-admin@swarmag.com`) never propagated to the pre-existing stage
      `auth.users` row — `ON CONFLICT` deliberately excludes `email`. Locked
      CA out of the admin app after logout.
- [x] Fixed live: one-off `UPDATE auth.users SET email = ...` against stage
- [x] `db-genesis-verify.ts` — join-based drift assertion between
      `auth.users.email` and `public.users.primary_email`; hard fail on any
      mismatch, no auto-resolution in either direction
- [x] `orchestration/user-orchestra.ts` `update()` — compensation symmetric
      to `create()`'s: reverts the domain email and rethrows the original
      error if `updateAuthEmail` fails after `updateUserRow` succeeds (this
      exact drift was independently reachable via a plain transient failure
      in the real application path, not just via genesis)
- [x] `architecture-back.md` §4.4 documents the `ON CONFLICT` exclusion and
      why it's intentional despite the surprise
- [x] `deno task check` green after all of the above; committed by CA

## Phase 5 — Deploy and Verify (Stage)

- [x] `deno task check` green
- [x] `supabase functions serve` — local runtime proof of the seam
- [x] Deploy 4 functions to stage (`deno task edge-deploy`); scripted
      round-trip integration test (admin JWT via `auth.admin.generateLink`;
      create → update(email) → eject → delete; assert UUID invariant each
      step) added to `source/tests/`
- [x] Manual app-admin User Manager pass against stage

Local `edge-serve` remains available as an optional fast-iteration tool, not
the primary workflow — for a solo pre-release team, deploy-to-stage-and-read-
logs is the cheaper loop once the deployment seam itself is proven (it is).

## Phase 5 Addendum — CORS Header Defect (D12, complete 2026-07-14)

- [x] Found: Phase 5's "manual app-admin User Manager pass" above was
      checked off, but a real browser CORS block on the follow-up POST
      (missing `apikey`/`x-client-info` in `Access-Control-Allow-Headers`)
      went undetected — every diagnostic tool used at the time (`curl`,
      `get_logs` request summaries) was structurally blind to a browser-only
      CORS enforcement failure. See D12 in the design doc for the full
      incident and the misleading "server hang" red herring it produced.
- [x] Fixed: `wrap-http-handler.ts`'s `makeCorsHeaders` default now includes
      `apikey, x-client-info`; exported for reuse (was previously
      unexported despite being documented as public).
- [x] `HttpCodes.gatewayTimeout` (504) added
- [x] NEW `core/service/wrap-supabase-shim.ts` — timeout + slow/failure-only
      logging wrapper, composed into all four `index.ts` entrypoints
- [x] Re-verified live: CORS preflight simulation + real browser
      create/update/delete/eject, all four functions, all confirmed working
- [x] Committed: `57adb09 — Agentic milestone -- user edge functions complete`

## Phase 6 — Close-out

- [x] Backlog: ban-based eject alternative, `user-reinstate`, shim generator,
      edge smoke in deploy pipeline, literals-invariant doc note
- [x] Commit strategy per CA; return to Customer Onboarding milestone

_End of Task List_
