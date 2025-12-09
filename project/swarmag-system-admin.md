# swarmAg System – Administrative Web Application

This document describes the **Admin Portal**, used by operations management.

It depends on:

- `source/domain` for the domain model and shared abstractions.
- `source/api/*` for backend Netlify Functions.
- Outputs produced here will later be consumed by the Operations PWA, but that app is not a dependency.

## 1. Purpose and Scope

The Admin Portal:

- Runs at `admin.swarmag.com`.
- Is a SolidJS + Radix UI + Kobalte desktop web app.
- Provides:
  - CRUD management for:
    - Services
    - Assets
    - Chemicals
    - Customers
    - Contacts
  - Tools to build JobPlans from JobAssessments.
  - Dashboards and reporting for jobs and operational status.

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
  - TypeScript + SolidJS + Radix UI.
- Use the shared `tsconfig.json` (`module: ESNext`, `moduleResolution: bundler`, `baseUrl: "source"`).
  - Prefer the configured aliases (`@domain/*`, `@api/*`, `@utils/*`, `@/*`) for imports.
- Import all domain types from `source/domain`.
- Use API client code that calls Netlify Functions in `source/api/*`.
- Do not define new domain entities that conflict with the SDK:
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
