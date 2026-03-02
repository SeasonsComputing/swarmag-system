# Genesis AI Code Gen — 3 of 3: Schema

You are an AI Coding Engine operating under `CONSTITUTION.md`. You have no
architectural authority. Implement exactly what is specified. Do not invent
tables, columns, constraints, or policies beyond what the domain model defines.

## Authority

In case of conflict:
`CONSTITUTION.md` → `architecture-core.md` → `domain.md` → `architecture-back.md`
→ `data-dictionary.md` → `style-guide.md`

You MUST ingest all of these files PRIOR to assessing your task. Confirm you
have no conflicts, questions, or concerns before generating any files.

## Prerequisite

Ingest all files under `source/domain/abstractions/` before generating output.
The abstraction files confirm the final domain shape. If any abstraction
conflicts with `data-dictionary.md`, escalate — do not proceed.

## Task

Generate `source/domain/schema/schema.sql` from scratch. Delete the existing
file and replace it completely. Do not patch.

This file is the canonical current-state schema — not a migration. It must be
idempotent and fully reproducible.

## Key Changes From Prior Schema

- `tasks` table — new; `Task` is now `Instantiable` with its own rows
- `questions` table — new; `Question` is now `Instantiable` with its own rows
- `workflow_tasks` junction table — new; replaces any embedded task composition
- `task_questions` junction table — new; replaces any embedded question composition
- `job_workflows` table — drop `sequence` column; it no longer exists
- `workflows` table — no `tasks` JSONB column; tasks are now normalized rows

## File Header

```sql
-- =============================================================================
-- swarmAg System — Canonical Schema
-- source/domain/schema/schema.sql
--
-- Authoritative current-state DDL. Generated from domain model.
-- Do not edit manually — regenerate from domain model.
-- Includes canonical seed data known at schema time.
-- Migrations in source/back/migrations/ express deltas from this state.
-- =============================================================================
```

## Drop Order

Emit `DROP TABLE IF EXISTS` for all tables in reverse dependency order at the
top of the file before any CREATE statements.

## SQL Conventions (non-negotiable)

Per `style-guide.md` section 12:

- `snake_case` for all identifiers
- Table names are plural nouns
- Column order: `id` → FK columns → domain columns → lifecycle columns
- `UUID PRIMARY KEY` — no database default; application always supplies ID
- `TIMESTAMPTZ` for all timestamps — never `TIMESTAMP`
- `TEXT` for strings — never `VARCHAR(n)`
- `JSONB NOT NULL DEFAULT '[]'::jsonb` for all `Composition*` fields
- `NOT NULL` on all required columns; nullable for optional fields and `deleted_at`
- `CHECK` constraint for every const-enum column
- RLS enabled on every table
- Section headers:

```sql
-- =============================================================================
-- {Section Name}
-- =============================================================================
```

## Section Order

1. Users
2. Asset Types & Assets
3. Chemicals
4. Customers
5. Services
6. Workflows, Tasks & Questions
7. Jobs
8. Seed Data

## Table Inventory

### Instantiable Tables (have `deleted_at`)

| Domain type         | Table                  |
| ------------------- | ---------------------- |
| `User`              | `users`                |
| `AssetType`         | `asset_types`          |
| `Asset`             | `assets`               |
| `Chemical`          | `chemicals`            |
| `Customer`          | `customers`            |
| `Service`           | `services`             |
| `Workflow`          | `workflows`            |
| `Task`              | `tasks`                |
| `Question`          | `questions`            |
| `Job`               | `jobs`                 |
| `JobAssessment`     | `job_assessments`      |
| `JobWorkflow`       | `job_workflows`        |
| `JobPlan`           | `job_plans`            |
| `JobPlanAssignment` | `job_plan_assignments` |
| `JobPlanChemical`   | `job_plan_chemicals`   |
| `JobWork`           | `job_work`             |

### Append-Only Tables (no `updated_at`, no `deleted_at`)

| Domain type       | Table                  |
| ----------------- | ---------------------- |
| `JobWorkLogEntry` | `job_work_log_entries` |

### Junction Tables (no lifecycle columns)

| Domain type                | Table                          |
| -------------------------- | ------------------------------ |
| `WorkflowTask`             | `workflow_tasks`               |
| `TaskQuestion`             | `task_questions`               |
| `ServiceRequiredAssetType` | `service_required_asset_types` |
| `JobPlanAsset`             | `job_plan_assets`              |

## Key Table Shapes

### `job_workflows` — no `sequence` column

```sql
CREATE TABLE job_workflows (
  id                   UUID        PRIMARY KEY,
  job_id               UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  basis_workflow_id    UUID        NOT NULL REFERENCES workflows(id) ON DELETE RESTRICT,
  modified_workflow_id UUID        REFERENCES workflows(id) ON DELETE RESTRICT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at           TIMESTAMPTZ
);
```

### `workflow_tasks` — junction with sequence

```sql
CREATE TABLE workflow_tasks (
  workflow_id UUID    NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  task_id     UUID    NOT NULL REFERENCES tasks(id) ON DELETE RESTRICT,
  sequence    INTEGER NOT NULL,
  PRIMARY KEY (workflow_id, task_id)
);
```

### `task_questions` — junction with sequence

```sql
CREATE TABLE task_questions (
  task_id     UUID    NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  question_id UUID    NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  sequence    INTEGER NOT NULL,
  PRIMARY KEY (task_id, question_id)
);
```

### `questions` — Instantiable with const-enum check

```sql
CREATE TABLE questions (
  id          UUID        PRIMARY KEY,
  prompt      TEXT        NOT NULL,
  type        TEXT        NOT NULL
                          CHECK (type IN ('text', 'number', 'boolean',
                                         'single-select', 'multi-select', 'internal')),
  help_text   TEXT,
  required    BOOLEAN,
  options     JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
```

### `tasks` — Instantiable

```sql
CREATE TABLE tasks (
  id          UUID        PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT,
  notes       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
```

## RLS Policy Pattern

Every table must have RLS enabled and appropriate policies. Follow the pattern
established in the prior schema for each role (administrator, sales, operations).
Junction tables get SELECT/INSERT/DELETE policies only — no UPDATE.
Append-only tables get SELECT/INSERT policies only — no UPDATE, no DELETE.

## Seed Data

Per `architecture-back.md` section 4.1.3. After all table definitions emit the
Seed Data section containing:

**Bootstrap admin user** — stable UUID `00000000-0000-7000-8000-000000000001`:

```sql
INSERT INTO users (id, display_name, primary_email, phone_number, roles, status)
VALUES (
  '00000000-0000-7000-8000-000000000001',
  'DevOps Admin',
  'devops-admin@swarmag.com',
  '',
  '["administrator"]'::jsonb,
  'active'
);
```

**Asset types** — all records from `data-lists.md` section 4.
Fields: `id`, `label`, `active` (all `true`).
IDs from `source/devops/seed-ids.txt` in file order.

**Services** — all records from `data-lists.md` sections 2 and 3.
Fields: `id`, `name`, `sku`, `category`.
Aerial: `category = 'aerial-drone-services'`
Ground: `category = 'ground-machinery-services'`
IDs from `source/devops/seed-ids.txt` continuing in file order.

**Internal questions** — all records from `data-lists.md` section 5 as
independently lifecycled `questions` rows with `type = 'internal'`.
No wrapper workflow or task required — these are standalone seed rows
referenced directly by `Answer.questionId`.
IDs from `source/devops/seed-ids.txt` continuing in file order.

## Quality Bar

Before finalizing verify:

- `tasks` and `questions` tables exist as full Instantiable tables with RLS
- `workflow_tasks` and `task_questions` junction tables exist
- `job_workflows` has no `sequence` column
- `workflows` table has no `tasks` JSONB column
- All `Composition*` fields are `JSONB NOT NULL DEFAULT '[]'::jsonb`
- All const-enum columns have `CHECK` constraints
- RLS enabled on every table with appropriate policies
- DROP statements cover all tables including `tasks`, `questions`,
  `workflow_tasks`, `task_questions` in correct reverse dependency order
- Seed data present and complete
- No `VARCHAR(n)`, no `TIMESTAMP`, no database-generated IDs
