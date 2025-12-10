# swarmAg System – Orchestration

This document defines how the swarmAg System should be implemented in phases:

- Phase 1 — Domain
- Phase 2 — Administration Website
- Phase 3 — Operations Mobile App
- Phase 4 — Customer Portal

The authoritative architecture is in `architecture.md`. 

## 1. Monorepo Layout

All code lives in a single repo with this structure (current state):

```text
/
├─ project/                              # docs, specs, & plans
├─ build/                                # TypeScript outDir, gitignored
├─ node_modules/                         # Dependent modules, gitignored
├─ source/                               # System source
│  ├─ apps/                              # SolidJS apps (ops/admin/customer)
│  ├─ common/                            # Shared runtime utilities (identifiers, time)
│  ├─ domain/                            # Canonical domain abstractions
│  ├─ api/                               # Netlify Functions (backend APIs)
│  ├─ samples/                           # Example domain data for docs/tests
│  └─ tests/                             # Placeholder for future automated tests
├─ package.json                          
├─ pnpm-lock.yaml
└─ tsconfig.json                         
```

## 2. Global Rules

These rules apply to every phase and every file:

1. **Language:** TypeScript everywhere using the root `tsconfig.json`.
   - `module: "ESNext"` + `moduleResolution: "bundler"` so the compiler matches the bundler/runtime behavior.
   - `baseUrl: "source"` with path aliases (`@common/*`, `@domain/*`, `@api/*`, `@/*`) for clean imports.
2. **Frontend:**
   - SolidJS + TanStack
   - Kobalte (**No Tailwind**)
   - Use vanilla CSS (semantic CSS / CSS Modules / tokens).
3. **Backend:**
   - Netlify Functions for synchronous HTTP APIs.
   - Supabase (Postgres, Auth, Storage, Realtime) as the backend platform.
4. **Domain Model:**
   - Canonical types live in `source/domain`.  
   - Do not redefine domain entities locally.
5. **IDs & Time:**
   - UUID v7 for IDs.
   - UTC timestamps.
6. **Offline & Auditability:**
   - Operations Mobile Application is offline-capable with a deterministic sync model.
   - JobLogs are append-only.
7. **Zero-cost bias:**
   - Prefer free tiers.
   - Keep heavy/expensive processing clearly isolated.

When new domain concepts or fields are needed:

1. Extend `source/domain/*` first.  
2. Then update backend `source/api/*`.  
3. Then adapt the front-ends under `source/apps/*`.

## 3. Phased Implementation Order

Development must follow this order:

1. **Phase 1 — Domain: `domain.md`**
   - Implement `source/domain/*` (canonical types + helpers).
   - Implement initial `source/api/*` (core APIs) that consume the domain SDK.

2. **Phase 2 — Admin Portal: `admin-web-app.md`**
   - Build `source/apps/admin` using domain types and API functions.

3. **Phase 3 — Ops Mobile App: `ops-mobile-app.md`**
   - Build `source/apps/ops` using domain types and API functions.

4. **Phase 4 — Customer Portal: `customer-portal.md`**
   - Build `source/apps/customer` as a read-only portal using domain types and read-only endpoints.
