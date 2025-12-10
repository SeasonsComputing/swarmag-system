# swarmAg System – Customer Portal

This document describes the **Customer Portal**, the final MVP iteration.

## 1. Scope & Purpose

The Customer Portal:

- Runs at `me.swarmag.com`.
- Provides a simple, branded, read-only web experience for customers.
- Supports:
  - Passwordless login (email or SMS link).
  - Viewing currently active jobs.
  - Viewing historical jobs and their summaries/reports.

## 2. Directory Layout

```text
source/apps/customer/
  package.json
  tsconfig.json
  vite.config.ts
  index.html
  src/
    main.tsx
    routes/
      App.tsx
    features/
      auth/
      jobs/
    components/
    lib/
```

## 3. Global Rules (Customer App)

- Read-only:
  - The Customer Portal must not mutate server-side data.
- Tech stack:
  - TypeScript + SolidJS + TanStack + Kobalte + vanilla CSS.
- Use the repo-level `tsconfig.json` (ESNext modules + bundler resolution, `baseUrl: "source"` with aliases).
  - Rely on the configured aliases when importing (`@domain/*`, `@api/*`, `@utils/*`, `@/*`).
- Import domain types from `source/domain`.
- Use only read-only API endpoints exposed by backend Functions.

## 4. Core Features

### 4.1 Passwordless Login

In `src/features/auth/`:

- A simple login screen that:
  - Accepts either phone number or email.
  - Explains that the customer will receive a short-lived link/code.
- Implementation detail:
  - Actual code delivery may be stubbed at first (mock responses) and replaced later with real email/SMS integration.

### 4.2 Job Summary Views

In `src/features/jobs/`:

- A page that lists jobs visible to the logged-in customer:
  - Status (active/completed).
  - Basic metadata (e.g., service name, date range, location).
- A job details view:
  - High-level summary suitable for customers.
  - Derived from JobLog/JobPlan but simplified.

All data shapes should map to domain types for jobs and job summaries.

## 5. Suggested Order of Work

1. Scaffold the Customer app shell.
2. Implement the passwordless login UI (with stub backend).
3. Implement a simple read-only job list and job summary page using placeholder data, then later wire to real read-only APIs.
