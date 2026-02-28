# Domain Schema Generation Prompt

You are an AI Coding Engine operating under `CONSTITUTION.md`. You have no architectural authority. Implement exactly what is specified. Do not invent tables, columns, constraints, or policies beyond what the domain model defines.

## Authority

In case of conflict: `CONSTITUTION.md` → `architecture-core.md` → `domain.md` → `architecture-back.md` → `style-guide.md`

You MUST ingest all of these files PRIOR to assessing your task. Confirm you have no conflicts, questions, or concerns before generating any files.

## Task

Generate `source/domain/schema/schema.sql` from scratch. Delete the existing file and replace it completely. Do not patch.

This file is the **canonical current-state schema** — not a migration. It must be idempotent and fully reproducible. It defines all tables, constraints, indexes, RLS enablement, and RLS policies.

At the top of the generated schema (immediately after the file header), emit `DROP TABLE IF EXISTS ...;` statements for all tables in reverse dependency order.

## File Header

Begin the file with:

```sql
-- =============================================================================
-- swarmAg System — Canonical Schema
-- source/domain/schema/schema.sql
--
-- Authoritative current-state DDL. Generated from domain.md.
-- Do not edit manually — regenerate from domain model.
-- Includes canonical seed data known at schema time.
-- Migrations in source/back/migrations/ express deltas from this state.
-- =============================================================================
```

## SQL Conventions

Conform strictly to `style-guide.md §12`. Key rules:

- `snake_case` for all identifiers
- Table names are plural nouns
- Column order: `id` → FK columns → domain columns → lifecycle columns (`created_at`, `updated_at`, `deleted_at`)
- `UUID` for all PKs and FKs; PK columns are `UUID PRIMARY KEY` with no default
- `TIMESTAMPTZ` for all timestamps — never `TIMESTAMP`
- `TEXT` for strings — never `VARCHAR(n)` unless a length constraint is architecturally required
- `JSONB NOT NULL DEFAULT '[]'::jsonb` for all `Composition*` fields — all compositions are stored as arrays regardless of cardinality; cardinality is enforced at the application layer
- `NOT NULL` on all required columns; nullable for optional fields and `deleted_at`
- `CHECK` constraint for every const-enum column — see §12.5
- No semicolons on anything except SQL statement terminators

## Section Structure

Organize tables into logical sections with section headers. Each section contains: `CREATE TABLE`, blank line, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, blank line, `CREATE POLICY` blocks, blank line, `CREATE INDEX` blocks.

Section order:

1. Users
2. Asset Types & Assets
3. Chemicals
4. Customers
5. Services
6. Workflows
7. Jobs

Section header format:

```sql
-- =============================================================================
-- {Section Name}
-- =============================================================================
```

## Table Inventory

### Instantiable Tables (have `deleted_at`)

| Domain type         | Table name             |
| ------------------- | ---------------------- |
| `User`              | `users`                |
| `AssetType`         | `asset_types`          |
| `Asset`             | `assets`               |
| `Chemical`          | `chemicals`            |
| `Customer`          | `customers`            |
| `Service`           | `services`             |
| `Workflow`          | `workflows`            |
| `Job`               | `jobs`                 |
| `JobAssessment`     | `job_assessments`      |
| `JobWorkflow`       | `job_workflows`        |
| `JobPlan`           | `job_plans`            |
| `JobPlanAssignment` | `job_plan_assignments` |
| `JobPlanChemical`   | `job_plan_chemicals`   |
| `JobWork`           | `job_work`             |

### Append-Only Tables (no `updated_at`, no `deleted_at`)

| Domain type       | Table name             |
| ----------------- | ---------------------- |
| `JobWorkLogEntry` | `job_work_log_entries` |

### Junction Tables (no lifecycle columns)

| Domain type                | Table name                     |
| -------------------------- | ------------------------------ |
| `ServiceRequiredAssetType` | `service_required_asset_types` |
| `JobPlanAsset`             | `job_plan_assets`              |

## Per-Table DDL Specifications

### `users`

```sql
CREATE TABLE users (
  id            UUID        PRIMARY KEY,
  display_name  TEXT        NOT NULL,
  primary_email TEXT        NOT NULL UNIQUE,
  phone_number  TEXT        NOT NULL,
  avatar_url    TEXT,
  roles         JSONB       NOT NULL DEFAULT '[]'::jsonb,
  status        TEXT        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'inactive')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);
```

RLS policies:

- `users_select_active` — SELECT — `USING (deleted_at IS NULL)`
- `users_select_self` — SELECT — `USING (id = auth.uid())`
- `users_insert_admin` — INSERT — `WITH CHECK (auth.jwt() ->> 'role' = 'administrator')`
- `users_update_self` — UPDATE — `USING (id = auth.uid())`
- `users_update_admin` — UPDATE — `USING (auth.jwt() ->> 'role' = 'administrator')`

Indexes: `users_primary_email_idx` (already covered by UNIQUE), `users_deleted_at_idx`

---

### `asset_types`

```sql
CREATE TABLE asset_types (
  id         UUID        PRIMARY KEY,
  label      TEXT        NOT NULL,
  active     BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

RLS policies:

- `asset_types_select_active` — SELECT — `USING (deleted_at IS NULL)`
- `asset_types_insert_admin` — INSERT — `WITH CHECK (auth.jwt() ->> 'role' = 'administrator')`
- `asset_types_update_admin` — UPDATE — `USING (auth.jwt() ->> 'role' = 'administrator')`

Indexes: `asset_types_deleted_at_idx`

---

### `assets`

```sql
CREATE TABLE assets (
  id            UUID        PRIMARY KEY,
  type_id       UUID        NOT NULL REFERENCES asset_types(id) ON DELETE RESTRICT,
  label         TEXT        NOT NULL,
  description   TEXT,
  serial_number TEXT,
  status        TEXT        NOT NULL
                            CONSTRAINT assets_status_check
                            CHECK (status IN ('active', 'maintenance', 'retired', 'reserved')),
  notes         JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);
```

RLS policies:

- `assets_select_active` — SELECT — `USING (deleted_at IS NULL)`
- `assets_insert_admin` — INSERT — `WITH CHECK (auth.jwt() ->> 'role' = 'administrator')`
- `assets_update_admin` — UPDATE — `USING (auth.jwt() ->> 'role' = 'administrator')`

Indexes: `assets_type_id_idx`, `assets_deleted_at_idx`

---

### `chemicals`

```sql
CREATE TABLE chemicals (
  id                    UUID        PRIMARY KEY,
  name                  TEXT        NOT NULL,
  epa_number            TEXT,
  usage                 TEXT        NOT NULL
                                    CONSTRAINT chemicals_usage_check
                                    CHECK (usage IN ('herbicide', 'pesticide', 'fertilizer', 'fungicide', 'adjuvant')),
  signal_word           TEXT        CONSTRAINT chemicals_signal_word_check
                                    CHECK (signal_word IN ('danger', 'warning', 'caution')),
  restricted_use        BOOLEAN     NOT NULL DEFAULT false,
  re_entry_interval_hours NUMERIC,
  storage_location      TEXT,
  sds_url               TEXT,
  labels                JSONB       NOT NULL DEFAULT '[]'::jsonb,
  notes                 JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ
);
```

RLS policies:

- `chemicals_select_active` — SELECT — `USING (deleted_at IS NULL)`
- `chemicals_insert_admin` — INSERT — `WITH CHECK (auth.jwt() ->> 'role' = 'administrator')`
- `chemicals_update_admin` — UPDATE — `USING (auth.jwt() ->> 'role' = 'administrator')`

Indexes: `chemicals_deleted_at_idx`

---

### `customers`

```sql
CREATE TABLE customers (
  id                  UUID        PRIMARY KEY,
  account_manager_id  UUID        REFERENCES users(id) ON DELETE RESTRICT,
  name                TEXT        NOT NULL,
  status              TEXT        NOT NULL
                                  CONSTRAINT customers_status_check
                                  CHECK (status IN ('active', 'inactive', 'prospect')),
  line1               TEXT        NOT NULL,
  line2               TEXT,
  city                TEXT        NOT NULL,
  state               TEXT        NOT NULL,
  postal_code         TEXT        NOT NULL,
  country             TEXT        NOT NULL,
  sites               JSONB       NOT NULL DEFAULT '[]'::jsonb,
  contacts            JSONB       NOT NULL DEFAULT '[]'::jsonb,
  notes               JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);
```

RLS policies:

- `customers_select_active` — SELECT — `USING (deleted_at IS NULL)`
- `customers_select_managed` — SELECT — `USING (account_manager_id = auth.uid())`
- `customers_insert_sales` — INSERT — `WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales'))`
- `customers_update_managed` — UPDATE — `USING (account_manager_id = auth.uid() OR auth.jwt() ->> 'role' = 'administrator')`

Indexes: `customers_account_manager_id_idx`, `customers_deleted_at_idx`

---

### `services`

```sql
CREATE TABLE services (
  id                       UUID        PRIMARY KEY,
  name                     TEXT        NOT NULL,
  sku                      TEXT        NOT NULL UNIQUE,
  description              TEXT,
  category                 TEXT        NOT NULL
                                       CONSTRAINT services_category_check
                                       CHECK (category IN ('aerial-drone-services', 'ground-machinery-services')),
  tags_workflow_candidates JSONB       NOT NULL DEFAULT '[]'::jsonb,
  notes                    JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at               TIMESTAMPTZ
);
```

RLS policies:

- `services_select_active` — SELECT — `USING (deleted_at IS NULL)`
- `services_insert_admin` — INSERT — `WITH CHECK (auth.jwt() ->> 'role' = 'administrator')`
- `services_update_admin` — UPDATE — `USING (auth.jwt() ->> 'role' = 'administrator')`

Indexes: `services_deleted_at_idx`

---

### `service_required_asset_types`

Junction — no lifecycle columns, hard delete only.

```sql
CREATE TABLE service_required_asset_types (
  service_id    UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  asset_type_id UUID NOT NULL REFERENCES asset_types(id) ON DELETE RESTRICT,
  PRIMARY KEY (service_id, asset_type_id)
);
```

RLS policies:

- `service_required_asset_types_select` — SELECT — `USING (true)`
- `service_required_asset_types_insert_admin` — INSERT — `WITH CHECK (auth.jwt() ->> 'role' = 'administrator')`
- `service_required_asset_types_delete_admin` — DELETE — `USING (auth.jwt() ->> 'role' = 'administrator')`

Indexes: `service_required_asset_types_asset_type_id_idx`

---

### `workflows`

```sql
CREATE TABLE workflows (
  id          UUID        PRIMARY KEY,
  name        TEXT        NOT NULL,
  description TEXT,
  version     INTEGER     NOT NULL DEFAULT 1,
  tags        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  tasks       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
```

RLS policies:

- `workflows_select_active` — SELECT — `USING (deleted_at IS NULL)`
- `workflows_insert_admin` — INSERT — `WITH CHECK (auth.jwt() ->> 'role' = 'administrator')`
- `workflows_update_admin` — UPDATE — `USING (auth.jwt() ->> 'role' = 'administrator')`

Indexes: `workflows_deleted_at_idx`

---

### `jobs`

```sql
CREATE TABLE jobs (
  id          UUID        PRIMARY KEY,
  customer_id UUID        NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status      TEXT        NOT NULL DEFAULT 'open'
                          CONSTRAINT jobs_status_check
                          CHECK (status IN (
                            'open', 'assessing', 'planning', 'preparing',
                            'executing', 'finalizing', 'closed', 'cancelled'
                          )),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
```

RLS policies:

- `jobs_select_active` — SELECT — `USING (deleted_at IS NULL)`
- `jobs_insert_sales` — INSERT — `WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales'))`
- `jobs_update_sales` — UPDATE — `USING (auth.jwt() ->> 'role' IN ('administrator', 'sales'))`

Indexes: `jobs_customer_id_idx`, `jobs_status_idx`, `jobs_deleted_at_idx`

---

### `job_assessments`

```sql
CREATE TABLE job_assessments (
  id           UUID        PRIMARY KEY,
  job_id       UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  assessor_id  UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  locations    JSONB       NOT NULL DEFAULT '[]'::jsonb,
  risks        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  notes        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);
```

RLS policies:

- `job_assessments_select_active` — SELECT — `USING (deleted_at IS NULL)`
- `job_assessments_insert_ops` — INSERT — `WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'))`
- `job_assessments_update_ops` — UPDATE — `USING (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'))`

Indexes: `job_assessments_job_id_idx`, `job_assessments_assessor_id_idx`, `job_assessments_deleted_at_idx`

---

### `job_workflows`

```sql
CREATE TABLE job_workflows (
  id                   UUID        PRIMARY KEY,
  job_id               UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  basis_workflow_id    UUID        NOT NULL REFERENCES workflows(id) ON DELETE RESTRICT,
  modified_workflow_id UUID        REFERENCES workflows(id) ON DELETE RESTRICT,
  sequence             INTEGER     NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at           TIMESTAMPTZ
);
```

RLS policies:

- `job_workflows_select_active` — SELECT — `USING (deleted_at IS NULL)`
- `job_workflows_insert_ops` — INSERT — `WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'))`
- `job_workflows_update_ops` — UPDATE — `USING (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'))`

Indexes: `job_workflows_job_id_idx`, `job_workflows_basis_workflow_id_idx`, `job_workflows_deleted_at_idx`

---

### `job_plans`

```sql
CREATE TABLE job_plans (
  id               UUID        PRIMARY KEY,
  job_id           UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  scheduled_start  TIMESTAMPTZ NOT NULL,
  scheduled_end    TIMESTAMPTZ,
  notes            JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);
```

RLS policies:

- `job_plans_select_active` — SELECT — `USING (deleted_at IS NULL)`
- `job_plans_insert_ops` — INSERT — `WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'))`
- `job_plans_update_ops` — UPDATE — `USING (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'))`

Indexes: `job_plans_job_id_idx`, `job_plans_deleted_at_idx`

---

### `job_plan_assignments`

```sql
CREATE TABLE job_plan_assignments (
  id         UUID        PRIMARY KEY,
  plan_id    UUID        NOT NULL REFERENCES job_plans(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role       TEXT        NOT NULL
                         CONSTRAINT job_plan_assignments_role_check
                         CHECK (role IN ('administrator', 'sales', 'operations')),
  notes      JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

RLS policies:

- `job_plan_assignments_select_active` — SELECT — `USING (deleted_at IS NULL)`
- `job_plan_assignments_insert_ops` — INSERT — `WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'))`
- `job_plan_assignments_update_ops` — UPDATE — `USING (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'))`

Indexes: `job_plan_assignments_plan_id_idx`, `job_plan_assignments_user_id_idx`, `job_plan_assignments_deleted_at_idx`

---

### `job_plan_chemicals`

```sql
CREATE TABLE job_plan_chemicals (
  id               UUID        PRIMARY KEY,
  plan_id          UUID        NOT NULL REFERENCES job_plans(id) ON DELETE CASCADE,
  chemical_id      UUID        NOT NULL REFERENCES chemicals(id) ON DELETE RESTRICT,
  amount           NUMERIC     NOT NULL,
  unit             TEXT        NOT NULL
                               CONSTRAINT job_plan_chemicals_unit_check
                               CHECK (unit IN ('gallon', 'liter', 'pound', 'kilogram')),
  target_area      NUMERIC,
  target_area_unit TEXT        CONSTRAINT job_plan_chemicals_target_area_unit_check
                               CHECK (target_area_unit IN ('acre', 'hectare')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);
```

RLS policies:

- `job_plan_chemicals_select_active` — SELECT — `USING (deleted_at IS NULL)`
- `job_plan_chemicals_insert_ops` — INSERT — `WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'))`
- `job_plan_chemicals_update_ops` — UPDATE — `USING (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'))`

Indexes: `job_plan_chemicals_plan_id_idx`, `job_plan_chemicals_chemical_id_idx`, `job_plan_chemicals_deleted_at_idx`

---

### `job_plan_assets`

Junction — no lifecycle columns, hard delete only.

```sql
CREATE TABLE job_plan_assets (
  plan_id  UUID NOT NULL REFERENCES job_plans(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  PRIMARY KEY (plan_id, asset_id)
);
```

RLS policies:

- `job_plan_assets_select` — SELECT — `USING (true)`
- `job_plan_assets_insert_ops` — INSERT — `WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'operations'))`
- `job_plan_assets_delete_ops` — DELETE — `USING (auth.jwt() ->> 'role' IN ('administrator', 'operations'))`

Indexes: `job_plan_assets_asset_id_idx`

---

### `job_work`

```sql
CREATE TABLE job_work (
  id             UUID        PRIMARY KEY,
  job_id         UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  started_by_id  UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  work           JSONB       NOT NULL DEFAULT '[]'::jsonb,
  started_at     TIMESTAMPTZ NOT NULL,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ
);
```

Notes: `work` is `JSONB NOT NULL DEFAULT '[]'::jsonb` — `CompositionPositive<Id>`, the immutable execution manifest. Cardinality enforced at application layer.

RLS policies:

- `job_work_select_active` — SELECT — `USING (deleted_at IS NULL)`
- `job_work_insert_ops` — INSERT — `WITH CHECK (auth.jwt() ->> 'role' = 'operations')`
- `job_work_update_ops` — UPDATE — `USING (auth.jwt() ->> 'role' IN ('administrator', 'operations'))`

Indexes: `job_work_job_id_idx`, `job_work_started_by_id_idx`, `job_work_deleted_at_idx`

---

### `job_work_log_entries`

Append-only — no `updated_at`, no `deleted_at`.

```sql
CREATE TABLE job_work_log_entries (
  id         UUID        PRIMARY KEY,
  job_id     UUID        NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  answer     JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Notes: `answer` is `JSONB NOT NULL DEFAULT '[]'::jsonb` — `CompositionOne<Answer>`, cardinality enforced at application layer. FK to `jobs` uses RESTRICT — log entries must not vanish silently if a job is soft-deleted (job deletion should be blocked while logs exist).

RLS policies:

- `job_work_log_entries_select_own` — SELECT — `USING (user_id = auth.uid())`
- `job_work_log_entries_select_ops` — SELECT — `USING (auth.jwt() ->> 'role' IN ('administrator', 'operations'))`
- `job_work_log_entries_insert_ops` — INSERT — `WITH CHECK (auth.jwt() ->> 'role' = 'operations' AND user_id = auth.uid())`

Indexes: `job_work_log_entries_job_id_idx`, `job_work_log_entries_user_id_idx`, `job_work_log_entries_created_at_idx`

---

## FK Cascade Policy Reference

| Child table                    | FK column              | References    | Policy   | Rationale                     |
| ------------------------------ | ---------------------- | ------------- | -------- | ----------------------------- |
| `assets`                       | `type_id`              | `asset_types` | RESTRICT | cross-entity reference        |
| `customers`                    | `account_manager_id`   | `users`       | RESTRICT | cross-entity reference        |
| `service_required_asset_types` | `service_id`           | `services`    | CASCADE  | owned by service              |
| `service_required_asset_types` | `asset_type_id`        | `asset_types` | RESTRICT | cross-entity reference        |
| `jobs`                         | `customer_id`          | `customers`   | RESTRICT | cross-entity reference        |
| `job_assessments`              | `job_id`               | `jobs`        | CASCADE  | owned by job                  |
| `job_assessments`              | `assessor_id`          | `users`       | RESTRICT | cross-entity reference        |
| `job_workflows`                | `job_id`               | `jobs`        | CASCADE  | owned by job                  |
| `job_workflows`                | `basis_workflow_id`    | `workflows`   | RESTRICT | cross-entity reference        |
| `job_workflows`                | `modified_workflow_id` | `workflows`   | RESTRICT | cross-entity reference        |
| `job_plans`                    | `job_id`               | `jobs`        | CASCADE  | owned by job                  |
| `job_plan_assignments`         | `plan_id`              | `job_plans`   | CASCADE  | owned by plan                 |
| `job_plan_assignments`         | `user_id`              | `users`       | RESTRICT | cross-entity reference        |
| `job_plan_chemicals`           | `plan_id`              | `job_plans`   | CASCADE  | owned by plan                 |
| `job_plan_chemicals`           | `chemical_id`          | `chemicals`   | RESTRICT | cross-entity reference        |
| `job_plan_assets`              | `plan_id`              | `job_plans`   | CASCADE  | owned by plan                 |
| `job_plan_assets`              | `asset_id`             | `assets`      | RESTRICT | cross-entity reference        |
| `job_work`                     | `job_id`               | `jobs`        | CASCADE  | owned by job                  |
| `job_work`                     | `started_by_id`        | `users`       | RESTRICT | cross-entity reference        |
| `job_work_log_entries`         | `job_id`               | `jobs`        | RESTRICT | logs must not vanish silently |
| `job_work_log_entries`         | `user_id`              | `users`       | RESTRICT | cross-entity reference        |

## Seed Data

Add a final section to `schema.sql` after all table definitions:

```sql
-- =============================================================================
-- Seed Data
-- =============================================================================
```

Seed data is canonical, known at schema time, and required for the system to function from first boot. It is part of `schema.sql` — not a migration.

Assign seed record IDs from `source/devops/seed-ids.txt` in file order, one UUID per seed record (`INSERT` block), and add a comment above each `INSERT` block:

```sql
-- Seed ID assignment: <uuid-from-seed-ids.txt>
INSERT INTO ...
```

### Bootstrap Admin User

A fixed bootstrap admin user is required to access the database after first deploy. Password is set via Supabase Auth dashboard post-deploy.

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

### Asset Types

Insert all records from `data-lists.md §4 Asset Types`. One `INSERT` per record. IDs come from `source/devops/seed-ids.txt` assignment order.

Fields: `id`, `label`, `active` (all `true`).

### Services

Insert all records from `data-lists.md §2 Aerial Drone Services` and `§3 Ground Machinery Services`. One `INSERT` per record. IDs come from `source/devops/seed-ids.txt` assignment order.

Fields: `id`, `name`, `sku`, `category`.

- Aerial services: `category = 'aerial-drone-services'`
- Ground services: `category = 'ground-machinery-services'`

### Internal Questions Workflow

Insert a single canonical `workflows` record that contains all internal questions from `data-lists.md §5` as a single task. This workflow serves as the registry for all system-generated telemetry and operational log entries.

```sql
INSERT INTO workflows (id, name, description, version, tags, tasks)
VALUES (
  '<uuid-from-seed-ids.txt>',
  'Internal Telemetry Questions',
  'System-generated internal questions for telemetry and operational log entries. Read-only.',
  1,
  '["internal", "system"]'::jsonb,
  -- tasks: single task containing all internal questions from data-lists.md §5
  -- each question: { id, prompt, type, required: false, options: [] }
  -- question ids: stable UUIDs (may be fixed literals; not seed record IDs)
  '[{ ... }]'::jsonb
);
```

Build the `tasks` JSONB array from `data-lists.md §5` exactly:

- One task: `{ "id": "<stable-task-uuid>", "title": "Internal Telemetry", "checklist": [ ... ] }`
- Each question in checklist: `{ "id": "<stable-uuid>", "prompt": "<key from data-lists>", "type": "internal", "required": false, "options": [] }`
- Question UUIDs are stable and deterministic across regenerations

## Quality Bar

Before finalizing verify:

1. Every `Instantiable` table has `id`, `created_at`, `updated_at`, `deleted_at` — in that relative position
2. Every append-only table has `id` and `created_at` only — no `updated_at`, no `deleted_at`
3. Every junction table has composite `PRIMARY KEY` — no `id`, no lifecycle columns
4. Every const-enum column has a `CHECK` constraint with the complete value set from `domain.md`
5. Every FK column has an explicit index (unless covered by PRIMARY KEY)
6. Every table has `ENABLE ROW LEVEL SECURITY` and at least one `SELECT` policy
7. All `Composition*` JSONB columns have `NOT NULL DEFAULT '[]'::jsonb` — cardinality is application-layer concern, not DB-layer
8. FK cascade policies match the reference table exactly
9. No `VARCHAR`, no `TIMESTAMP` (without zone), no `SERIAL` — use `TEXT`, `TIMESTAMPTZ`, `UUID`
10. Table order respects FK dependencies — referenced tables appear before referencing tables
11. Section headers present for all eight sections (seven domain sections + seed data)
