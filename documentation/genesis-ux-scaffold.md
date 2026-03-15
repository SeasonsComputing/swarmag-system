# Genesis Prompt -- UX Application Scaffolding

You are an AI Coding Engine operating under `CONSTITUTION.md`. You have no
architectural authority. Implement exactly what is specified. Do not invent
abstractions, reinterpret intent, or cross architectural boundaries.

## 1. Authority

Authoritative source set, in order:

1. `CONSTITUTION.md`
2. `documentation/architecture-core.md`
3. `documentation/architecture-ux.md`
4. `documentation/domain.md`
5. `documentation/style-guide.md`

Do not restate or fork these rules in this prompt. This prompt is orchestration only.

## RUN BLOCKER -- EXECUTION DISABLED UNTIL SECTION IS ABSENT

This prompt is genesis-only and must be run exactly once for UX scaffold bootstrap.
Do not execute while this section exists. Execution is enabled only when this
section is absent.

## 2. Task Contract

The UX scaffold is the foundational layer of all three deployed applications:
`app-admin`, `app-ops`, and `app-customer`. It covers shared infrastructure in
`common/` and the minimal application shell for each app — enough to boot,
authenticate, and render a dashboard. No domain pages are generated here.

Treat this scaffold as the authoritative baseline for generated UX shell files.
For any scaffold-created leaf directory with no implementation file yet, add
`placeholder.txt`.

### 2.1 Preflight — UX Toolchain Bootstrap

Before generation, ensure the UX toolchain dependencies resolve in this repo.
Use Deno-native dependency resolution:

```bash
deno cache --reload \
  npm:solid-js \
  npm:@tanstack/solid-router \
  npm:vite \
  npm:vite-plugin-solid
```

Then verify imports resolve:

```bash
deno eval "await import('npm:solid-js'); await import('npm:@tanstack/solid-router'); await import('npm:vite'); await import('npm:vite-plugin-solid')"
```

If preflight fails, stop and fix dependency resolution before scaffold generation.

Next proceed generation in the following phase order.

### 2.2 Phase I — Common

Generate the shared UX infrastructure consumed by all three apps.

#### 2.2.1 Files

```text
source/ux/common/
  components/
    login/
      login.tsx
    forms/
      form-panel.tsx
    shell/
      auth-guard.tsx
      content.tsx
  stores/
    session-store.ts
    app-state-store.ts
```

Pre-existing auth client integration remains unchanged and is out of scaffold
generation scope:

```text
source/ux/common/lib/auth-supabase-client.ts
```

#### 2.2.2 Specifications

Common UX behavior is defined by architecture and is not restated here:

- Authentication flow and auth-state binding: `architecture-ux.md` §6.3
- Session store contract: `architecture-ux.md` §6.4
- IndexedDb usage and app store naming: `architecture-ux.md` §6.5
- State-management responsibilities: `architecture-ux.md` §6.6
- Component boundaries and shell behavior: `architecture-ux.md` §6.7
- File inventory baseline (with this prompt's path adjustments): `architecture-ux.md` §6.8

Scaffold-only deltas for Phase I:

- `auth-guard.tsx` path is `source/ux/common/components/shell/auth-guard.tsx`.
- `app-state-store.ts` persists app preference keys as:
  `{storeName}:theme`, `{storeName}:dashboard:layout`,
  `{storeName}:dashboard:panels`.

### 2.3 Phase II — App Admin Shell

Generate the `app-admin` application shell.

#### 2.3.1 Files

```text
source/ux/app-admin/
  index.html
  vite.config.ts
  app.tsx
  dashboard/
    dashboard.tsx
```

#### 2.3.2 Specifications

**`index.html`**

Standard Vite SPA entry. References `app.tsx` as module entry. Sets
`<title>swarmAg Admin</title>`. Includes PWA manifest link placeholder.

**`vite.config.ts`**

Vite config for `app-admin`.

- Imports path aliases from `deno.jsonc` — use `denoResolve()` or manual alias
  map consistent with `architecture-core.md` §7.1.
- Output dir: `dist/app-admin`.
- Plugin: SolidJS.
- No other plugins unless required by the stack.

**`app.tsx`**

Application root.

- Follow route shape and guard pattern from `architecture-ux.md` §6.2 and §6.7.
- Import `Config` from `@ux/config/ux-config.ts` only.
- Construct app state with `makeAppStateStore('swarmag-admin-app')`.
- Boot sequence after authentication:
  1. Call `api.hydrateUser(sessionStore.userId)` and pass result to
     `setSessionUser(user)`.
  2. Call `setDataReady()`. Admin has no idb job load step.

**`dashboard/dashboard.tsx`**

Admin dashboard stub.

- Renders a heading and a placeholder message. No domain data yet.
- This file will be replaced during domain page generation.

### 2.4 Phase III — App Ops Shell

Generate the `app-ops` application shell, including the idb job hydration boot
sequence.

#### 2.4.1 Files

```text
source/ux/app-ops/
  index.html
  vite.config.ts
  app.tsx
  dashboard/
    dashboard.tsx
  stores/
    jobs-store.ts
```

#### 2.4.2 Specifications

**`index.html`**

Standard Vite SPA entry. References `app.tsx` as module entry. Sets
`<title>swarmAg Ops</title>`. Includes PWA manifest link placeholder.

**`vite.config.ts`**

Vite config for `app-ops`. Same structure as `app-admin`; output dir
`dist/app-ops`.

**`jobs-store.ts`**

Ops-only idb job manifest store. Holds lightweight summaries of jobs cloned to
this device — not full aggregates. Full job trees are read from idb on demand
by the workflow engine only.

- Backed by SolidJS `createStore`.
- Shape:

```typescript
type JobsStore = {
  jobs: JobSummary[] // lightweight manifest — id, status, title
  isLoaded: boolean
}
```

- `isLoaded` starts `false`. Set `true` after the initial idb read resolves.
- Exports: `jobsStore` (read-only reactive), `loadJobs()` (async).
- No Supabase calls. This store reads from idb only.
- `api.JobsLocal` is not yet implemented. For the scaffold phase, `loadJobs()`
  sets `jobs: []` and `isLoaded: true` immediately. Include an explicit
  `// TODO: replace with api.JobsLocal read when client maker is implemented`
  comment at the stub site.

**`app.tsx`**

Application root.

- Follow route shape and guard pattern from `architecture-ux.md` §6.2 and §6.7.
- Import `Config` from `@ux/config/ux-config.ts` only.
- Construct app state with `makeAppStateStore('swarmag-ops-app')`.
- Boot sequence after authentication:
  1. Call `api.hydrateUser(sessionStore.userId)` and pass result to
     `setSessionUser(user)`.
  2. Call `loadJobs()` from `jobs-store.ts`.
  3. When `jobsStore.isLoaded` becomes `true`, call `setDataReady()`.
- Dashboard renders only after `isDataReady` is `true`. While loading, render
  a loading indicator inside `<Content>`.

**`dashboard/dashboard.tsx`**

Ops dashboard stub.

- Renders a heading and a placeholder message. No domain data yet.
- This file will be replaced during crew workflow engine generation.

### 2.5 Phase IV — App Customer Shell

Generate the `app-customer` application shell.

#### 2.5.1 Files

```text
source/ux/app-customer/
  index.html
  vite.config.ts
  app.tsx
  dashboard/
    dashboard.tsx
```

#### 2.5.2 Specifications

**`index.html`**

Standard Vite SPA entry. References `app.tsx` as module entry. Sets
`<title>swarmAg</title>`. Includes PWA manifest link placeholder.

**`vite.config.ts`**

Vite config for `app-customer`. Same structure as `app-admin`; output dir
`dist/app-customer`.

**`app.tsx`**

Application root.

- Follow route shape and guard pattern from `architecture-ux.md` §6.2 and §6.7.
- Import `Config` from `@ux/config/ux-config.ts` only.
- Construct app state with `makeAppStateStore('swarmag-customer-app')`.
- Boot sequence after authentication:
  1. Call `api.hydrateUser(sessionStore.userId)` and pass result to
     `setSessionUser(user)`.
  2. Call `setDataReady()`. Customer has no idb job load step.

**`dashboard/dashboard.tsx`**

Customer dashboard stub.

- Renders a heading and a placeholder message. No domain data yet.
- This file will be replaced during customer portal generation.

## 3. Execution Contract

1. Ingest the authority set in §1.
2. **Phase I:** Generate all `common/` files.
3. **Phase II:** Generate `app-admin/` files.
4. **Phase III:** Generate `app-ops/` files.
5. **Phase IV:** Generate `app-customer/` files.
6. Before running `deno task check`: confirm `deno.jsonc` `check:types` glob
   covers `source/**/*.{ts,tsx}`. If it only covers `*.ts`, update the glob
   first — this scaffold generates `.tsx` files.
   Run `deno task check` across all generated files. Fix and re-run until clean.
7. Report `STYLE_AUDIT` per the output contract below.
8. Return only when `STYLE_AUDIT: PASS`.

## 4. Output Contract

Responses that include code changes must include:

- `STYLE_AUDIT: PASS` or `STYLE_AUDIT: FAIL`
- If `FAIL`: `- path:line — rule — issue`
- If `PASS`: list of audited generated files

## 5. Quality Bar

Before reporting `STYLE_AUDIT: PASS`:

- All Common UX artifacts conform to `architecture-ux.md` §6.3-§6.8.
- `auth-guard.tsx` is generated at
  `source/ux/common/components/shell/auth-guard.tsx`.
- `app-admin/app.tsx`: imports `Config` from `@ux/config/ux-config.ts`; calls
  `setSessionUser`, then `setDataReady`.
- `app-ops/app.tsx`: imports `Config` from `@ux/config/ux-config.ts`; calls
  `setSessionUser`, then `loadJobs()`, then `setDataReady()` only after
  `jobsStore.isLoaded` is `true`.
- `app-customer/app.tsx`: imports `Config` from `@ux/config/ux-config.ts`;
  calls `setSessionUser`, then `setDataReady`.
- `jobs-store.ts`: shape uses `JobSummary[]` and `isLoaded`; `loadJobs()` stub
  sets `jobs: []` and `isLoaded: true` with TODO comment; no Supabase calls.
- No prop-drilling of session or user — all consumers read from `session-store.ts`
  directly.
- All exported symbols have `/** */` JSDoc per `style-guide.md` §6.5.
- All section headers use the canonical width per `style-guide.md` §6.4.
- No `@back/*` imports anywhere in `source/ux/`.
- No direct `@core/cfg` imports in any `app.tsx` — config flows through
  `@ux/config/ux-config.ts`.
- `deno.jsonc` `check:types` glob covers `source/**/*.{ts,tsx}` before running.
- `deno task check` exits clean.

_End of Genesis Prompt for UX Application Scaffolding Document_
