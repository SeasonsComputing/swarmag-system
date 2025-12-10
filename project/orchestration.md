# swarmAg System – Orchestration

This document defines how the swarmAg System should be implemented in phases:

| Phase | Module | Doc | Description |
| ----- | ------ | --- | ----------- |
| 1 | Domain | `domain.md` | Domain model of foundational abstractions/contracts/APIs |
| 2 | Admin Web App | `admin-web-app.md` | Real-time dashboards; jobs/schedules; catalog |
| 3 | Ops Mobile App | `ops-mobile-app.md` | Field operations and job logging |
| 4 | Customer Portal | `customer-portal.md` | Read-only customer experience |

**Primary work per phase**

| Phase | Primary Work |
| ----- | ------------ |
| 1 | Implement domain types (`source/domain/*`) and initial APIs (`source/api/*`) |
| 2 | Build admin app with real-time dashboards and catalog admin |
| 3 | Build `source/apps/ops` using domain types and API functions |
| 4 | Build read-only customer portal (`source/apps/customer`) using domain types |

The authoritative architecture is in `architecture.md`. 

## 1. Monorepo Layout

All code lives in a single repo with this structure (current state):

```text
/
├─ project/                  # docs, specs, plans, style guide
├─ source/                   # system source
│  ├─ api/                   # Netlify Functions (backend APIs)
│  ├─ apps/                  # SolidJS apps (admin/ops/customer)
│  │  ├─ admin/              # Admin web app
│  │  ├─ ops/                # Ops mobile app
│  │  └─ customer/           # Customer portal
│  ├─ domain/                # canonical domain abstractions
│  ├─ samples/               # example domain data for docs/tests
│  ├─ tests/                 # placeholder for future automated tests
│  └─ utils/                 # shared primitives (identifiers, time)
├─ build/                    # TypeScript outDir (gitignored)
├─ node_modules/             # dependencies (gitignored)
├─ README.md                 # repo overview
├─ package.json
├─ pnpm-lock.yaml
├─ tsconfig.json
├─ tsconfig.tsbuildinfo      # TypeScript build cache (gitignored)
├─ swarmag-ops-logo.png      # branding asset
└─ swarmag-ops-meta-prompt.md # meta prompt reference
```

## 2. Global Rules

These rules apply to every phase and every file:

1. **Language:** TypeScript everywhere using the root `tsconfig.json`.
   - `module: "ESNext"` + `moduleResolution: "bundler"` so the compiler matches the bundler/runtime behavior.
   - `baseUrl: "source"` with path aliases (`@common/*`, `@domain/*`, `@api/*`, `@/*`) for clean imports.
2. **Frontend:**
   - TypeScript + SolidJS + TanStack + Kobalte (**No Tailwind**)
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
