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
source/ux/applications/administration/
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
  - Prefer the shared UX API client (`source/ux/api/client/`) for backend access and DTOs.
- UX must not import backend function code or persistence logic directly.
- Do not define new domain abstractions that conflict with the runtime API contracts:
  - If new concepts are needed, extend `source/domain` first.

## 4. Initial Feature Focus — Services

Start with **Services management** as a representative CRUD flow.

In `src/features/services/`:

- `ServiceList.tsx`:
  - Display a table/list of `Service` items.
- Use types imported from the shared UX API contracts.
- Load data via the runtime API client.

- `ServiceForm.tsx`:
  - Create/edit forms for `Service`.
  - Fields: SKU, name, category (`aerial` / `ground`), description, etc.
  - Early on, submissions may be stubbed (no-op or mock); later iterations can wire to real create/update APIs.

## 5. App Shell and Navigation

- Implement `src/main.tsx` and `src/routes/App.tsx` with:
  - A basic layout (header + main area).
  - Navigation between key sections (Services, Assets, Chemicals, Jobs, Customers).
