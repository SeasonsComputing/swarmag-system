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
conflicts with `data-dictionary.md`, escalate and stop.

## Required Deliverables (all are required)

1. Recreate `source/domain/schema/schema.sql` from scratch (full replace; do not patch).
2. Validate schema execution in a disposable lint database.
3. Apply schema to the local Supabase Postgres runtime.
4. Verify final table inventory and seed counts.

Do not stop after file generation.

## Task

Generate `source/domain/schema/schema.sql` as canonical current-state DDL.
This file is not a migration. It must be idempotent and fully reproducible.

## Key Changes From Prior Schema

- `tasks` table exists; `Task` is independently lifecycled.
- `questions` table exists; `Question` is independently lifecycled.
- `workflow_tasks` junction exists and carries `sequence`.
- `task_questions` junction exists and carries `sequence`.
- `job_workflows` has no `sequence` column.
- `workflows` has no `tasks` JSONB column.

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

Emit `DROP TABLE IF EXISTS` for all domain tables in reverse dependency order
at the top of the file before any `CREATE TABLE` statements.

## SQL Conventions (non-negotiable)

Per `style-guide.md` section 12:

- `snake_case` identifiers only
- plural table names
- column order: `id` → FK columns → domain columns → lifecycle columns
- `UUID PRIMARY KEY` with no DB-generated default
- `TIMESTAMPTZ` only (never `TIMESTAMP`)
- `TEXT` for strings (never `VARCHAR(n)`)
- all `Composition*` fields as `JSONB NOT NULL DEFAULT '[]'::jsonb`
- `NOT NULL` on required fields
- nullable optional fields and `deleted_at`
- `CHECK` constraint for every const-enum column
- RLS enabled on every table

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

- `users`
- `asset_types`
- `assets`
- `chemicals`
- `customers`
- `services`
- `workflows`
- `tasks`
- `questions`
- `jobs`
- `job_assessments`
- `job_workflows`
- `job_plans`
- `job_plan_assignments`
- `job_plan_chemicals`
- `job_work`

### Append-Only Tables (no `updated_at`, no `deleted_at`)

- `job_work_log_entries`

### Junction Tables (no lifecycle columns)

- `workflow_tasks`
- `task_questions`
- `service_required_asset_types`
- `job_plan_assets`

## Required Table Shapes

`job_workflows` (no `sequence`):

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

`workflow_tasks`:

```sql
CREATE TABLE workflow_tasks (
  workflow_id UUID    NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  task_id     UUID    NOT NULL REFERENCES tasks(id) ON DELETE RESTRICT,
  sequence    INTEGER NOT NULL,
  PRIMARY KEY (workflow_id, task_id)
);
```

`task_questions`:

```sql
CREATE TABLE task_questions (
  task_id     UUID    NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  question_id UUID    NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  sequence    INTEGER NOT NULL,
  PRIMARY KEY (task_id, question_id)
);
```

`questions`:

```sql
CREATE TABLE questions (
  id         UUID        PRIMARY KEY,
  prompt     TEXT        NOT NULL,
  type       TEXT        NOT NULL
                         CHECK (type IN ('text', 'number', 'boolean',
                                        'single-select', 'multi-select', 'internal')),
  help_text  TEXT,
  required   BOOLEAN,
  options    JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

`tasks`:

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

Every table must have RLS enabled and role-aware policies (`administrator`,
`sales`, `operations`) matching current domain intent.

- Junction tables: `SELECT`, `INSERT`, `DELETE` only (no `UPDATE` policy).
- Append-only table (`job_work_log_entries`): `SELECT`, `INSERT` only
  (no `UPDATE`, no `DELETE` policy).

## Seed Data

Per `architecture-back.md` section 4.1.3:

- Bootstrap admin user (fixed UUID):
  `00000000-0000-7000-8000-000000000001`
- Asset types: all `data-lists.md` section 4 entries.
- Services: all `data-lists.md` sections 2 and 3 entries.
- Internal questions: all `data-lists.md` section 5 entries as standalone
  `questions` rows with `type = 'internal'`.

## Seed ID Source of Truth (genesis behavior)

Use exactly one file: `source/devops/seed-ids.txt`.

This is a genesis run. Treat seed IDs as fully consumed by this run.

Required behavior:

1. If `source/devops/seed-ids.txt` exists, rename it before generating anything
   (`seed-ids.txt.<timestamp>`).
2. Create a brand-new `source/devops/seed-ids.txt` for this run.
3. Fill that new file with exactly the IDs needed by this schema seed section.
4. Consume IDs in contiguous file order while writing schema seed inserts.
5. After schema generation completes, remove `source/devops/seed-ids.txt`
6. Assignment order from the newly generated `seed-ids.txt` must be contiguous:

1. Asset types (9)
2. Services (12)
3. Internal questions (14)

Do not invent seed IDs and do not reuse IDs outside this sequence.

## Execution Protocol (non-optional)

After writing `schema.sql`, execute all of the following steps in order.

### 1) Determine Supabase DB container

Identify Postgres container via Docker (`supabase_db_*`).

### 2) Lint in disposable DB

Create a disposable database (`schema_lint_db`) and execute schema there first.

If RLS compilation fails due to missing `auth.uid()`/`auth.jwt()` in the lint DB,
create temporary stubs in lint DB only, rerun lint, then continue.

### 3) Apply to local runtime DB

Apply to active local `postgres` DB used by Supabase runtime.

If legacy baseline tables block drops (dependency conflicts), clear only
`public` tables with `CASCADE` and then reapply `schema.sql`.
Do not drop `auth`, `storage`, or other Supabase-managed schemas.

### 4) Verify post-apply

Run verification queries and report exact counts:

- number of `public` tables
- `users` seed count
- `asset_types` seed count
- `services` seed count
- internal `questions` seed count (`type='internal'`)

## Suggested Command Sequence

Use equivalent commands if needed; behavior must match.

```bash
# rotate and regenerate seed IDs for this genesis run

if [ -f source/devops/seed-ids.txt ]; then
  mv source/devops/seed-ids.txt "source/devops/seed-ids.$(date +%Y%m%d%H%M%S).bak.txt"
fi

# generate exactly 35 UUID v7 IDs via @core-std id() into source/devops/seed-ids.txt
# then consume them in order:
# - 9 asset types
# - 12 services
# - 14 internal questions

# find db container

docker ps --format '{{.Names}}' | rg '^supabase_db'

# lint db lifecycle

docker exec <db_container> psql -U postgres -d template1 -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS schema_lint_db;" \
  -c "CREATE DATABASE schema_lint_db;"

# optional lint-db auth stubs when needed

docker exec <db_container> psql -U postgres -d schema_lint_db -v ON_ERROR_STOP=1 \
  -c "CREATE SCHEMA IF NOT EXISTS auth;" \
  -c "CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT NULL::uuid';" \
  -c "CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS 'SELECT ''{}''::jsonb';"

# lint apply

docker exec -i <db_container> psql -U postgres -d schema_lint_db -v ON_ERROR_STOP=1 \
  < source/domain/schema/schema.sql

# apply to runtime db

docker exec -i <db_container> psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  < source/domain/schema/schema.sql

# if blocked by legacy dependencies, clear public tables then reapply

docker exec <db_container> psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  -c "DO \\$\\$ DECLARE r RECORD; BEGIN FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END \\$\\$;"

docker exec -i <db_container> psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  < source/domain/schema/schema.sql

# finalize genesis consumption: leave no IDs available

: > source/devops/seed-ids.txt
```

## Quality Bar

Before finalizing verify all are true:

- `tasks` and `questions` exist and are full Instantiable tables with RLS
- `workflow_tasks` and `task_questions` junctions exist
- `job_workflows` has no `sequence`
- `workflows` has no `tasks` JSONB column
- all `Composition*` fields use `JSONB NOT NULL DEFAULT '[]'::jsonb`
- all const-enum columns have `CHECK` constraints
- every table has RLS enabled
- drop order includes all tables in reverse dependency order
- `seed-ids.txt` was rotated if present, regenerated for this run, fully consumed in schema order, and left empty at completion
- no `VARCHAR(n)` and no `TIMESTAMP`
- schema lint apply and runtime apply both succeed with `ON_ERROR_STOP=1`
