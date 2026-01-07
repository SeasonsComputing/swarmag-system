# swarmAg System – Operations Mobile Application

This document describes the **Operations Mobile App** used by crews in the field.

## 1. Scope

The Operations Mobile App:

- Runs at `ops.swarmag.com`.
- Is offline-first and installable as a PWA.
- Allows crews to:
  - View assigned jobs and plans.
  - Execute workflows (task sequences).
  - Append JobLog entries (photos, GPS, comments).
- Uses a deterministic offline sync model:
  - Local queue of operations.
  - Append-only JobLog semantics.

## 2. Directory Layout

```text
source/apps/ops/
  package.json
  tsconfig.json
  vite.config.ts
  index.html
  src/
    main.tsx
    routes/
      App.tsx
    features/
      workflows/
      jobs/
    components/
    lib/
```

## 3. Global Rules (Ops App)

- Tech stack:
  - TypeScript + SolidJS + TanStack + Kobalte + vanilla CSS.
  - No Tailwind.
- Use the repo-level Deno import aliases from `deno.json`.
- Import via configured aliases: `@domain/*`, `@serverless/*`, `@utils/*`.
- Must import domain types from `source/domain`.
- Must call backend APIs via Netlify Functions (not ad-hoc URLs).
- Must be structured by features (`src/features/<feature>`).
- Accessibility:
  - Aim for WCAG 2.1 AA where reasonable.

## 4. Core Features to Implement

### 4.1 App Shell

- `index.html` — base HTML file.
- `vite.config.ts` — Vite config for SolidJS with TypeScript.
- `src/main.tsx` — application bootstrap.
- `src/routes/App.tsx` — top-level layout, navigation shell.

### 4.2 Workflow Runner

In `src/features/workflows/WorkflowRunner.tsx`:

- Render tasks defined in the domain model:
  - `Note` (read-only text).
  - Yes/No questions.
  - Free-text comment questions.
- Collect answers and surface them as a domain-shaped structure (using domain types where possible).

### 4.3 Job Log (Local)

- A simple, in-memory (or minimal local storage/IndexedDB) JobLog store:
  - Append-only.
  - Batches changes for sync (exact sync logic can be stubbed initially).
- Future iterations can extend this to a robust offline queue, but the initial structure should anticipate that evolution.

## 5. Suggested Order of Work

1. Scaffold the app shell:
    - `deno.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/routes/App.tsx`.
2. Implement a minimal navigation and layout.
3. Create `WorkflowRunner` with a small, in-memory sample workflow.
4. Add a basic in-memory JobLog store and wire it into `WorkflowRunner`.

