# swarmAg System – Administrative Web Application

This document describes the **Admin Webapp**, the operational control center for management.

## 1. Purpose and Scope

The Admin Webapp:

- Runs at `admin.swarmag.com`.
- Is a SolidJS + TanStack + Kobalte + vanilla CSS desktop webapp.
- Provides:
  - Real-time dashboards of jobs, schedules, and job progress.
  - Assignment and scheduling for assets, crews, and customers.
  - Catalog management (services, assets, chemicals, customers, contacts).
  - Tools to build and adjust JobPlans from JobAssessments.
  - Reporting on operational status.

## 2. Directory Layout

```text
source/apps/admin/
  package.json
  tsconfig.json
  vite.config.ts
  index.html
  src/
    main.tsx
    routes/
      App.tsx
    features/
      services/
      assets/
      chemicals/
      jobs/
      customers/
    components/
    lib/
```

## 3. Global Rules (Admin App)

- Tech stack:
  - TypeScript + SolidJS + TanStack + Kobalte + vanilla CSS.
- Use the shared Deno import aliases from `deno.json`.
  - Prefer the configured aliases (`@domain/*`, `@serverless/*`, `@utils/*`) for imports.
- Import all domain types from `source/domain`.
- Use API client code that calls Netlify Functions in `source/serverless/functions/*`.
- Do not define new domain abstractions that conflict with the SDK:
  - If new concepts are needed, extend `source/domain` first.

## 4. Initial Feature Focus — Services

Start with **Services management** as a representative CRUD flow.

In `src/features/services/`:

- `ServiceList.tsx`:
  - Display a table/list of `Service` items.
  - Use types imported from `source/domain`.
  - Load data via a client that calls the `service-list` API.

- `ServiceForm.tsx`:
  - Create/edit forms for `Service`.
  - Fields: SKU, name, category (`aerial` / `ground`), description, etc.
  - Early on, submissions may be stubbed (no-op or mock); later iterations can wire to real create/update APIs.

## 5. App Shell and Navigation

- Implement `src/main.tsx` and `src/routes/App.tsx` with:
  - A basic layout (header + main area).
  - Navigation between key sections (Services, Assets, Chemicals, Jobs, Customers).

