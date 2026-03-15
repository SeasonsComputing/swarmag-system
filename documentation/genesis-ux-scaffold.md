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

The UX scaffold is the foundational layer of both deployed applications: `app-admin`
and `app-ops`. It covers shared infrastructure in `common/` and the minimal
application shell for each app — enough to boot, authenticate, and render a
dashboard. No domain pages are generated here.

Always prompt the user to determine if this is a "genesis" run or not. If it is a
genesis run, remove all existing artifacts under `source/ux/common/`,
`source/ux/app-admin/`, and `source/ux/app-ops/` before generation. Genesis
supplants all prior knowledge; treat every file as if being written for the first
time.

Next proceed generation in the following phase order.

### 2.1 Phase I — Common

Generate the shared UX infrastructure consumed by both apps.

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
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean   // true during initial Supabase session check on boot
  isDataReady: boolean // true when app is ready to render dashboard
}
```

- Backed by SolidJS `createStore`.
- Bootstraps by calling `supabase.auth.getSession()` once on module load; sets
  `isLoading: false` on resolution.
- Subscribes to `supabase.auth.onAuthStateChange`; keeps store in sync.
- No component reads Supabase Auth directly — all session state flows through
  this store.
- `isDataReady` is not set here; each app shell sets it after its own boot
  sequence completes.
- Exports: `sessionStore` (read-only reactive), `setSessionStore` (private to
  this module — not exported), `login(email, password)`, `logout()`.

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
  `/login` via SolidJS Router `<Navigate>`.
- When authenticated: renders `<props.children>` (the protected subtree).
- No domain logic. No data fetching.

**`login.tsx`**

Brand entry point — not a generic form.

- Calls `login(email, password)` from `session-store.ts`.
- On success, the auth state change listener in `session-store.ts` drives
  redirect; `login.tsx` does not navigate directly.
- Shows an error message on failure.
- No navigation imports needed; session store drives app state.

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

- Imports path aliases from `deno.json` — use `denoResolve()` or manual alias
  map consistent with `architecture-core.md` §7.1.
- Output dir: `dist/app-admin`.
- Plugin: SolidJS.
- No other plugins unless required by the stack.

**`app.tsx`**

Application root.

- Initializes `Config` per `architecture-ux.md` §4.2 using `SolidProvider` and
  the required env keys.
- Constructs `appStateStore` via `makeAppStateStore('swarmag-admin-app')`.
- Uses SolidJS Router. Two routes:
  - `/login` → `<Login />`
  - `/*` → `<AuthGuard><Shell /></AuthGuard>`
- `<Shell>` renders `<Content>` with `<Dashboard />` inside.
- After session is established (`sessionStore.isAuthenticated` becomes `true`),
  sets `sessionStore.isDataReady = true`. Admin has no idb job hydration step.

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

Ops-only idb job aggregate store.

- Backed by SolidJS `createStore`.
- Shape:

```typescript
type JobsStore = {
  jobs: Job[]
  isHydrated: boolean
}
```

- `isHydrated` starts `false`. Set `true` after the initial idb load resolves.
- Exports: `jobsStore` (read-only reactive), `hydrateJobs()` (async — reads all
  Job aggregates from `api.JobsLocal`).
- No Supabase calls. This store reads from idb only.

**`app.tsx`**

Application root.

- Initializes `Config` per `architecture-ux.md` §4.2 using `SolidProvider`.
- Constructs `appStateStore` via `makeAppStateStore('swarmag-ops-app')`.
- Uses SolidJS Router. Two routes:
  - `/login` → `<Login />`
  - `/*` → `<AuthGuard><Shell /></AuthGuard>`
- `<Shell>` renders `<Content>` with `<Dashboard />` inside.
- Boot sequence after authentication:
  1. Call `hydrateJobs()` from `jobs-store.ts`.
  2. When `jobsStore.isHydrated` becomes `true`, set
     `sessionStore.isDataReady = true`.
- Dashboard renders only after `isDataReady` is `true`. While hydrating, render
  a loading indicator inside `<Content>`.

**`dashboard/dashboard.tsx`**

Ops dashboard stub.

- Renders a heading and a placeholder message. No domain data yet.
- This file will be replaced during crew workflow engine generation.

---

## 3. Execution Contract

1. Ingest the authority set in §1.
2. If genesis run: remove all artifacts under `source/ux/common/`,
   `source/ux/app-admin/`, and `source/ux/app-ops/`.
3. **Phase I:** Generate all `common/` files.
4. **Phase II:** Generate `app-admin/` files.
5. **Phase III:** Generate `app-ops/` files.
6. Run `deno task check` across all generated files. Fix and re-run until clean.
7. Report `STYLE_AUDIT` per the output contract below.
8. Return only when `STYLE_AUDIT: PASS`.

## 4. Output Contract

Responses that include code changes must include:

- `STYLE_AUDIT: PASS` or `STYLE_AUDIT: FAIL`
- If `FAIL`: `- path:line — rule — issue`
- If `PASS`: list of audited generated files

## 5. Quality Bar

Before reporting `STYLE_AUDIT: PASS`:

- `session-store.ts`: `isLoading` and `isDataReady` are distinct signals; no
  component reads Supabase Auth directly.
- `auth-guard.tsx`: renders nothing during `isLoading`; redirects on
  unauthenticated; no data fetching.
- `app-admin/app.tsx`: sets `isDataReady` immediately on auth — no hydration
  step.
- `app-ops/app.tsx`: sets `isDataReady` only after `jobsStore.isHydrated` is
  `true`.
- `jobs-store.ts`: reads from `api.JobsLocal` only — no Supabase calls.
- No prop-drilling of session or user — all consumers read from `session-store.ts`
  directly.
- All exported symbols have `/** */` JSDoc per `style-guide.md` §6.5.
- All section headers use the canonical width per `style-guide.md` §6.4.
- No `@back/*` imports anywhere in `source/ux/`.
- `deno task check` exits clean.

_End of Genesis Prompt for UX Application Scaffolding Document_
