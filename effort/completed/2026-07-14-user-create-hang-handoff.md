# User-Create Edge Function Hang — Session Handoff

**Date:** 2026-07-14
**Mode:** Repair
**Purpose:** New-session handoff to continue diagnosing a hang in the deployed
`user-create` edge function on stage. Written for an AI session with no prior
context.

## 1. Governing Context — Ingest Before Production

- Invariants: `AGENTS.md`, then `CONSTITUTION.md`
- Prior work this traces from: `effort/completed/2026-07-12-edge-functions-remediation-{design,tasks}.md`
  (D1–D11, Phases 0–5). Phase 5's stage deploy already happened (functions are
  live and `ACTIVE` on project `vpntxhqnwyudhiadsmtn`) — do not redo it.
- Symptom that started this session: "Save is not working" in `app-stage-local
  admin`'s User Manager, reported as `"Failed to send a request to the Edge
  Function"` (a `supabase-js` `FunctionsFetchError`).

## 2. Bug #1 — Found and Fixed (confirmed resolved, committed separately)

**Root cause:** `source/core/std/wrap-http-handler.ts`'s `makeResponse`
constructed 204/304 responses as `new Response('', { status, ... })`. Per the
Fetch spec, a null-body status must carry `body: null`, not an empty string.
Local Deno's `Response` constructor tolerates `''`; the hosted Supabase edge
runtime (Cloudflare-fronted) enforces the spec strictly and threw
`TypeError: Response with null body status cannot have body` on every CORS
preflight (`OPTIONS`) — visible as `OPTIONS | 500` in edge-function logs.
Since a failed preflight blocks the browser from ever sending the real
request, this looked exactly like "Save doesn't work."

**Fix applied and deployed:** `new Response(null, { ... })`. Redeployed via
`deno task edge-deploy` (all four functions now on deployment version `2`,
build `0.1.754+3041288`). Verified live: `OPTIONS` now returns `204` for all
four functions, confirmed via direct curl against the hosted endpoint.

**This fix is real and should not be reverted or re-investigated.** It is
committed in the working tree (uncommitted at session end — see §5).

## 3. Bug #2 — Found, NOT Fixed — This Is What The Next Session Should Solve

After fixing Bug #1, "Add User" still failed with the same
`"Failed to send a request to the Edge Function"` message, in both the CA's
real browser and a sandboxed reproduction. Extensive investigation (CORS
duplicate-header theory, redirect theory, browser-extension/proxy theory) was
pursued and **all ruled out** by direct evidence — do not re-investigate these:

- No redirect on the actual request (`curl -L` shows `num_redirects: 0`).
- `mode: 'no-cors'` fetch to the same URL with the same headers **succeeds**
  (network/TLS layer is fully fine).
- No CORS violation message ever appears in the browser console for the
  failing request (a real CORS block always logs one in Chrome — this didn't).
- **Every OPTIONS preflight succeeds (204)** for every method tried
  (GET/POST), confirmed via edge-function request logs correlated by exact
  timestamp.

**The actual root cause, confirmed via Supabase's lifecycle logs (`Boot`/
`Shutdown` event types, not the request-summary logs `get_logs` normally
surfaces):**

```
Boot     019f604d-41df-7b96-9d86-94cc37543a22   2026-07-14T11:05:03.963Z   boot_time: 58ms
Shutdown 019f604d-41df-7b96-9d86-94cc37543a22   2026-07-14T11:06:19.055Z   reason: "EarlyDrop", cpu_time_used: 78ms
```

**The function boots fine (58ms) and is invoked for real** — this directly
contradicts an earlier (wrong) conclusion reached mid-session that the actual
POST never reaches the server; it does. But between boot and shutdown, **75
seconds elapse while only 78ms of CPU time is consumed** — the invocation is
almost entirely idle, i.e. **hanging on something that never resolves**, until
the client eventually gives up and disconnects (`EarlyDrop` = client dropped
the connection while the function was still running, not a crash and not a
platform-imposed timeout).

**Where to look next:** `authorizeAdmin` in
`source/back/supabase-edge/orchestration/user-orchestra.ts` is the one code
path that only executes with a _real, valid_ admin JWT — every diagnostic
curl/fetch test in this session used either no token or a garbage token,
which fails fast inside `makeSupabaseEdgeAuth.verifyCaller` (`serviceClient.auth.getUser(token)`)
or the fast bearer-token-missing check, neither of which reaches the hang.
Only the CA's real logged-in browser session ever exercised the full path:

```
verifyCaller(request)                                    // core/service/make-supabase-edge-auth.ts
  → serviceClient.auth.getUser(token)                     // network call #1
  → callerClient (caller-scoped, public key + forwarded caller JWT)
callerUserRow(callerClient, authUserId)                   // user-orchestra.ts
  → getUserRow → callerClient.from('users').select('*')...single()   // network call #2, RLS-scoped
```

Prime suspects for the hang, in likely order:

1. **`callerClient.from('users').select(...)` under RLS** — this is a
   PostgREST query using the caller-scoped client (anon key + forwarded user
   JWT as an `Authorization` header, not a Supabase session). This exact
   client construction (`core/service/make-supabase-edge-auth.ts`'s
   `supabaseClient()` helper) has never been proven to work end-to-end
   against RLS on real infrastructure before this session — Phase 4's RLS
   verification used the MCP `execute_sql` tool (superuser, bypasses RLS
   entirely) and raw curl tests (which never carried a real user JWT this
   deep). It is plausible this specific client shape causes PostgREST or the
   connection pooler to hang rather than fail cleanly under some interaction
   with `TO authenticated` RLS. Test this in isolation first.
2. **`serviceClient.auth.getUser(token)`** hanging against Supabase Auth
   specifically for a real (not garbage) JWT — less likely given `no-cors`
   proved basic network/TLS is fine, but not yet directly isolated from #1.
3. Something specific to the **Deno edge runtime's connection pooling**
   toward Postgres under this project's current pooler configuration
   (`[db.pooler] enabled = false` in `supabase/config.toml` — direct
   connections only, no PgBouncer/Supavisor in front. Worth checking whether
   this project's actual hosted Postgres expects pooled connections and a
   direct connection from many short-lived edge workers is exhausting
   available connections, causing later connections to hang waiting for a
   slot).

**Recommended first diagnostic step for the next session:** add a temporary
`console.log` immediately before and after each `await` in `verifyCaller` and
`callerUserRow`/`getUserRow`, redeploy, trigger one real "Add User" attempt
from the CA's authenticated browser, then pull `get_logs(service:
"edge-function")` — the `log` level entries (not just Boot/Shutdown/request
summaries) will show exactly which specific `await` never returns. This is
the fastest way to stop guessing and get a definitive answer.

## 4. How To Investigate (tooling notes learned this session)

- `mcp__<supabase-project>__get_logs(service: "edge-function")` returns a
  **mixed stream**: HTTP request-summary entries (`event_message: "METHOD |
  status | url"`) AND lifecycle entries (`event_type: "Boot"` / `"Shutdown"`,
  with `execution_id`/`request_id` fields, boot time, shutdown reason, CPU/
  memory usage). **Always check both — a hang produces no request-summary
  entry at all, only a Boot/Shutdown pair with a large timestamp gap.**
- `deno task db-reset --target stage` and any `globalThis.prompt()`-gated
  script **cannot be run by an AI agent** — it requires a real TTY and will
  return `null` on piped/non-interactive stdin by design (this is intentional
  per the devops docs, not a bug). The CA must run these directly.
- The Claude Code Browser pane (sandboxed) and the CA's real browser were
  independently confirmed to exhibit **the same failure**, correlated by
  matching exact request timestamps against server logs — the sandbox is not
  a confounding variable for this specific investigation.
- `supabase login --token <x>` reports `"You are now logged in"` **even for
  an invalid token** — it only writes locally, never validates. Use
  `supabase projects list` to actually verify auth works.

## 5. Current Repo State

- Bug #1 fix (`wrap-http-handler.ts` null-body response) is applied locally
  and **already deployed** to stage (version 2, build `0.1.754+3041288`).
  Confirmed live via curl.
- The Bug #1 fix, plus everything from the prior remediation session (D1–D11,
  committed earlier), plus a documentation-honesty pass (stale import-map
  references in `architecture-core.md` and the tasks doc) — check `git
  status` at session start; there may be uncommitted doc fixes plus this
  session's `wrap-http-handler.ts` change. Run `deno task check` first; it
  was green as of this session's last check.
- No code changes for Bug #2 have been made yet — only diagnosis.
- **No new user rows exist in stage's `public.users`** — confirmed via direct
  query. The hang means creates are failing closed, not silently succeeding;
  no cleanup needed.
- Bootstrap admin (`devops-admin@swarmag.com`, same UUID in both `auth.users`
  and `public.users`) is confirmed synced and working for login as of this
  session.

## 6. Working Rules

- Operating modes and production gates per `AGENTS.md` — state scope, wait for
  CA approval, report after production with `STYLE_AUDIT`.
- This is Repair mode: investigation is authorized by the failure; propose
  repair scope before mutating code.
- The CA expects analysis + proposal first on design questions.
- Run `deno task fmt` and `deno task check` before claiming completion.
- Verify claims against real evidence (logs, live curl, live queries) — this
  session went through several wrong theories before the lifecycle logs gave
  a definitive answer; don't skip straight to a fix without that level of
  confirmation this time either.

_End of Handoff Document_
