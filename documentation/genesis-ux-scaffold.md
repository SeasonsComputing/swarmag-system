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

## 2. Task Contract

The UX scaffold is the foundational layer of all three deployed applications:
`app-admin`, `app-ops`, and `app-customer`. It covers shared infrastructure in
`common/` and the minimal application shell for each app — enough to boot,
authenticate, and render a dashboard. No domain pages are generated here.

Always prompt the user to determine if this is a "genesis" run or not. If it is a
genesis run, remove all existing artifacts under `source/ux/common/`,
`source/ux/app-admin/`, `source/ux/app-ops/`, and `source/ux/app-customer/` before
generation. Genesis supplants all prior knowledge; treat every file as if being
written for the first time.

Next proceed generation in the following phase order.

### 2.1 Phase I — Common

Generate the shared UX infrastructure consumed by all three apps.

#### Files

```text
source/ux/common/
  components/
    login/
      login.tsx
    forms/
      form-panel.tsx
    shell/
      content.tsx
    auth-guard.tsx
  stores/
    session-store.ts
    app-state-store.ts
```

#### Specifications

**`session-store.ts`**

Implements the `SessionStore` reactive store. Shape (from `architecture-ux.md` §6.4):

```typescript
type SessionStore = {
  userId: Id | null
  user: User | null // hydrated after auth via api.hydrateUser(userId)
  isAuthenticated: boolean
  isLoading: boolean // true during initial session check on boot
  isDataReady: boolean // true when app is ready to render dashboard
}
```

- Backed by SolidJS `createStore`.
- Bootstraps by calling `api.Auth.getSession()` once on module load; sets
  `isLoading: false` on resolution.
- Subscribes to `api.Auth.onAuthStateChange`; keeps store in sync.
- On auth state change: sets `userId` from `Session`; `user` remains `null`
  until the app shell calls `api.hydrateUser(userId)` and writes the result.
- No component reads Supabase Auth directly — all session state flows through
  this store.
- `isDataReady` is not set here; each app shell sets it after its own boot
  sequence completes.
- Exports:
  - `sessionStore` — read-only reactive store
  - `logout()` — calls `api.Auth.logout()`
  - `setSessionUser(user: User): void` — called by app shell after `api.hydrateUser` resolves
  - `setDataReady(): void` — called by app shell after boot sequence completes

**`app-state-store.ts`**

Implements the `AppStateStore` reactive store. Persists app preferences to idb.

- Backed by SolidJS `createStore`.
- `storeName` is injected at construction — the idb store name differs per app
  (`swarmag-admin-app`, `swarmag-ops-app`, `swarmag-customer-app`).
- Reads initial state from idb on construction; writes on every mutation.
- Keys follow the pattern `{storeName}:theme`, `{storeName}:dashboard:layout`,
  `{storeName}:dashboard:panels`.
- No business data. No domain types.
- Exports: factory function `makeAppStateStore(storeName: string)`.

**`auth-guard.tsx`**

Route-level session guard component.

- Reads `sessionStore.isLoading` and `sessionStore.isAuthenticated`.
- While `isLoading` is `true`: renders nothing (prevents login flash).
- When `isLoading` is `false` and `isAuthenticated` is `false`: redirects to
  `/login` via TanStack Router `<Navigate>`.
- When authenticated: renders `<props.children>` (the protected subtree).
- No domain logic. No data fetching.

**`login.tsx`**

Brand entry point — not a generic form. Implements a two-step passwordless OTP
flow: collect contact → verify code.

- Step 1: renders `<props.children>` as the contact input slot — each app
  supplies its own prompt and field (email for admin/ops, email for customer).
  Calls `api.Auth.sendOtp(email)` on submit.
- Step 2: renders a code entry field. Calls `api.Auth.verifyOtp(email, token)`
  on submit.
- On successful verification, the auth state change listener in
  `session-store.ts` drives the transition to the authenticated shell.
  `login.tsx` does not navigate directly.
- Shows an error message on failure at either step.
- No navigation imports needed; session store drives app state.
- Accepts `children: JSX.Element` — the contact input slot.

**`form-panel.tsx`**

Adaptive form container.

- Renders full-screen on mobile, modal-centered on desktop.
- Uses a CSS media query via a CSS class — no JS breakpoint detection.
- Accepts `title: string`, `children: JSX.Element`, and optional
  `onClose: () => void` props.
- No domain coupling.

**`content.tsx`**

Main content frame.

- Renders a `<main>` element that occupies remaining viewport height after the
  app shell header.
- Accepts `children: JSX.Element`.
- No business logic.

---

### 2.2 Phase II — App Admin Shell

Generate the `app-admin` application shell.

#### Files

```text
source/ux/app-admin/
  index.html
  vite.config.ts
  app.tsx
  dashboard/
    dashboard.tsx
```

#### Specifications

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

- Imports `Config` from `@ux/config/ux-config.ts` — not directly from `@core/cfg`.
- Constructs `appStateStore` via `makeAppStateStore('swarmag-admin-app')`.
- Uses TanStack Router. Routes:
  - `/` → redirect to `/dashboard` or `/login` based on auth state
  - `/login` → `<Login><AdminContactField /></Login>`
  - `/dashboard` → `<AuthGuard><Shell /></AuthGuard>` (renders `<Dashboard />`)
  - `/[domain]` → `<AuthGuard><Shell /></AuthGuard>` (domain pages, added later)
- `<Shell>` renders `<Content>` with `<Dashboard />` inside.
- Boot sequence after authentication:
  1. Call `api.hydrateUser(sessionStore.userId)` and pass result to
     `setSessionUser(user)`.
  2. Call `setDataReady()`. Admin has no idb job load step.

**`dashboard/dashboard.tsx`**

Admin dashboard stub.

- Renders a heading and a placeholder message. No domain data yet.
- This file will be replaced during domain page generation.

---

### 2.3 Phase III — App Ops Shell

Generate the `app-ops` application shell, including the idb job hydration boot
sequence.

#### Files

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

#### Specifications

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
  jobs: JobSummary[]  // lightweight manifest — id, status, title
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

- Imports `Config` from `@ux/config/ux-config.ts` — not directly from `@core/cfg`.
- Constructs `appStateStore` via `makeAppStateStore('swarmag-ops-app')`.
- Uses TanStack Router. Routes:
  - `/` → redirect to `/dashboard` or `/login` based on auth state
  - `/login` → `<Login><OpsContactField /></Login>`
  - `/dashboard` → `<AuthGuard><Shell /></AuthGuard>` (renders `<Dashboard />`)
  - `/[domain]` → `<AuthGuard><Shell /></AuthGuard>` (domain pages, added later)
- `<Shell>` renders `<Content>` with `<Dashboard />` inside.
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

---

### 2.4 Phase IV — App Customer Shell

Generate the `app-customer` application shell.

#### Files

```text
source/ux/app-customer/
  index.html
  vite.config.ts
  app.tsx
  dashboard/
    dashboard.tsx
```

#### Specifications

**`index.html`**

Standard Vite SPA entry. References `app.tsx` as module entry. Sets
`<title>swarmAg</title>`. Includes PWA manifest link placeholder.

**`vite.config.ts`**

Vite config for `app-customer`. Same structure as `app-admin`; output dir
`dist/app-customer`.

**`app.tsx`**

Application root.

- Imports `Config` from `@ux/config/ux-config.ts` — not directly from `@core/cfg`.
- Constructs `appStateStore` via `makeAppStateStore('swarmag-customer-app')`.
- Uses TanStack Router. Routes:
  - `/` → redirect to `/dashboard` or `/login` based on auth state
  - `/login` → `<Login><CustomerContactField /></Login>`
  - `/dashboard` → `<AuthGuard><Shell /></AuthGuard>` (renders `<Dashboard />`)
  - `/[domain]` → `<AuthGuard><Shell /></AuthGuard>` (domain pages, added later)
- `<Shell>` renders `<Content>` with `<Dashboard />` inside.
- Boot sequence after authentication:
  1. Call `api.hydrateUser(sessionStore.userId)` and pass result to
     `setSessionUser(user)`.
  2. Call `setDataReady()`. Customer has no idb job load step.

**`dashboard/dashboard.tsx`**

Customer dashboard stub.

- Renders a heading and a placeholder message. No domain data yet.
- This file will be replaced during customer portal generation.

---



## 3. Execution Contract

1. Ingest the authority set in §1.
2. If genesis run: remove all artifacts under `source/ux/common/`,
   `source/ux/app-admin/`, `source/ux/app-ops/`, and `source/ux/app-customer/`.
3. **Phase I:** Generate all `common/` files.
4. **Phase II:** Generate `app-admin/` files.
5. **Phase III:** Generate `app-ops/` files.
6. **Phase IV:** Generate `app-customer/` files.
7. Before running `deno task check`: confirm `deno.jsonc` `check:types` glob
   covers `source/**/*.{ts,tsx}`. If it only covers `*.ts`, update the glob
   first — this scaffold generates `.tsx` files.
   Run `deno task check` across all generated files. Fix and re-run until clean.
8. Report `STYLE_AUDIT` per the output contract below.
9. Return only when `STYLE_AUDIT: PASS`.

## 4. Output Contract

Responses that include code changes must include:

- `STYLE_AUDIT: PASS` or `STYLE_AUDIT: FAIL`
- If `FAIL`: `- path:line — rule — issue`
- If `PASS`: list of audited generated files

## 5. Quality Bar

Before reporting `STYLE_AUDIT: PASS`:

- `session-store.ts`: `userId` and `user` are separate fields; `isLoading` and
  `isDataReady` are distinct; all auth calls go through `api.Auth` — no direct
  Supabase Auth imports; exports `setSessionUser(user)` and `setDataReady()`.
- `auth-guard.tsx`: renders nothing during `isLoading`; redirects via TanStack
  Router on unauthenticated; no data fetching.
- `login.tsx`: two-step OTP flow; accepts `children` slot; calls
  `api.Auth.sendOtp` and `api.Auth.verifyOtp`; does not navigate directly.
- `app-admin/app.tsx`: imports `Config` from `@ux/config/ux-config.ts`; uses
  TanStack Router with full route shape; calls `setSessionUser` then `setDataReady`.
- `app-ops/app.tsx`: imports `Config` from `@ux/config/ux-config.ts`; uses
  TanStack Router with full route shape; calls `setSessionUser`, then `loadJobs()`,
  then `setDataReady()` only after `jobsStore.isLoaded` is `true`.
- `app-customer/app.tsx`: imports `Config` from `@ux/config/ux-config.ts`; uses
  TanStack Router with full route shape; calls `setSessionUser` then `setDataReady`.
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
