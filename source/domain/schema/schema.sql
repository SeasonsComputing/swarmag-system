-- =============================================================================
-- swarmAg System — Canonical Schema
-- source/domain/schema/schema.sql
--
-- Authoritative current-state DDL. Generated from domain model.
-- Do not edit manually — regenerate from domain model.
-- Includes canonical seed data known at schema time.
-- Migrations in source/back/migrations/ express deltas from this state.
-- =============================================================================

DROP TABLE IF EXISTS job_work_log_entries;
DROP TABLE IF EXISTS job_work;
DROP TABLE IF EXISTS job_plan_assets;
DROP TABLE IF EXISTS job_plan_chemicals;
DROP TABLE IF EXISTS job_plan_assignments;
DROP TABLE IF EXISTS job_plans;
DROP TABLE IF EXISTS job_workflows;
DROP TABLE IF EXISTS job_assessments;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS workflow_tasks;
DROP TABLE IF EXISTS task_questions;
DROP TABLE IF EXISTS workflows;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS service_required_asset_types;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS chemicals;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS asset_types;
DROP TABLE IF EXISTS users;

-- =============================================================================
-- Users
-- =============================================================================

CREATE TABLE users (
  id            UUID        PRIMARY KEY,
  display_name  TEXT        NOT NULL,
  primary_email TEXT        NOT NULL,
  phone_number  TEXT        NOT NULL,
  avatar_url    TEXT,
  roles         JSONB       NOT NULL DEFAULT '[]'::jsonb,
  status        TEXT        CONSTRAINT users_status_check
                            CHECK (status IN ('active', 'inactive')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_active ON users
  FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY users_select_self ON users
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY users_insert_admin ON users
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY users_update_self ON users
  FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY users_update_admin ON users
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY users_delete_admin ON users
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX users_deleted_at_idx ON users (deleted_at);

-- =============================================================================
-- Asset Types & Assets
-- =============================================================================

CREATE TABLE asset_types (
  id         UUID        PRIMARY KEY,
  label      TEXT        NOT NULL,
  active     BOOLEAN     NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE asset_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY asset_types_select_active ON asset_types
  FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY asset_types_insert_admin ON asset_types
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY asset_types_update_admin ON asset_types
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY asset_types_delete_admin ON asset_types
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX asset_types_deleted_at_idx ON asset_types (deleted_at);

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

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY assets_select_active ON assets
  FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY assets_insert_admin ON assets
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY assets_update_admin ON assets
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY assets_delete_admin ON assets
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX assets_type_id_idx ON assets (type_id);
CREATE INDEX assets_deleted_at_idx ON assets (deleted_at);

-- =============================================================================
-- Chemicals
-- =============================================================================

CREATE TABLE chemicals (
  id                      UUID        PRIMARY KEY,
  name                    TEXT        NOT NULL,
  epa_number              TEXT,
  usage                   TEXT        NOT NULL
                                      CONSTRAINT chemicals_usage_check
                                      CHECK (usage IN ('herbicide', 'pesticide', 'fertilizer', 'fungicide', 'adjuvant')),
  signal_word             TEXT        CONSTRAINT chemicals_signal_word_check
                                      CHECK (signal_word IN ('danger', 'warning', 'caution')),
  restricted_use          BOOLEAN     NOT NULL,
  re_entry_interval_hours INTEGER,
  storage_location        TEXT,
  sds_url                 TEXT,
  labels                  JSONB       NOT NULL DEFAULT '[]'::jsonb,
  notes                   JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

ALTER TABLE chemicals ENABLE ROW LEVEL SECURITY;

CREATE POLICY chemicals_select_active ON chemicals
  FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY chemicals_insert_admin ON chemicals
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY chemicals_update_admin ON chemicals
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY chemicals_delete_admin ON chemicals
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX chemicals_deleted_at_idx ON chemicals (deleted_at);

-- =============================================================================
-- Customers
-- =============================================================================

CREATE TABLE customers (
  id                 UUID        PRIMARY KEY,
  account_manager_id UUID        REFERENCES users(id) ON DELETE RESTRICT,
  name               TEXT        NOT NULL,
  status             TEXT        NOT NULL
                                  CONSTRAINT customers_status_check
                                  CHECK (status IN ('active', 'inactive', 'prospect')),
  line1              TEXT        NOT NULL,
  line2              TEXT,
  city               TEXT        NOT NULL,
  state              TEXT        NOT NULL,
  postal_code        TEXT        NOT NULL,
  country            TEXT        NOT NULL,
  sites              JSONB       NOT NULL DEFAULT '[]'::jsonb,
  contacts           JSONB       NOT NULL DEFAULT '[]'::jsonb,
  notes              JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at         TIMESTAMPTZ
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY customers_select_active ON customers
  FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY customers_select_managed ON customers
  FOR SELECT
  USING (account_manager_id = auth.uid());

CREATE POLICY customers_insert_sales ON customers
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales'));

CREATE POLICY customers_update_sales ON customers
  FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('administrator', 'sales'));

CREATE POLICY customers_delete_admin ON customers
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX customers_account_manager_id_idx ON customers (account_manager_id);
CREATE INDEX customers_deleted_at_idx ON customers (deleted_at);

-- =============================================================================
-- Services
-- =============================================================================

CREATE TABLE services (
  id                       UUID        PRIMARY KEY,
  name                     TEXT        NOT NULL,
  sku                      TEXT        NOT NULL,
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

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY services_select_active ON services
  FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY services_insert_admin ON services
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY services_update_admin ON services
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY services_delete_admin ON services
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX services_deleted_at_idx ON services (deleted_at);

CREATE TABLE service_required_asset_types (
  service_id    UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  asset_type_id UUID NOT NULL REFERENCES asset_types(id) ON DELETE RESTRICT,
  PRIMARY KEY (service_id, asset_type_id)
);

ALTER TABLE service_required_asset_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_required_asset_types_select ON service_required_asset_types
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY service_required_asset_types_insert_admin ON service_required_asset_types
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY service_required_asset_types_delete_admin ON service_required_asset_types
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX service_required_asset_types_asset_type_id_idx ON service_required_asset_types (asset_type_id);

-- =============================================================================
-- Workflows, Tasks & Questions
-- =============================================================================

CREATE TABLE questions (
  id         UUID        PRIMARY KEY,
  prompt     TEXT        NOT NULL,
  type       TEXT        NOT NULL
                         CONSTRAINT questions_type_check
                         CHECK (type IN ('text', 'number', 'boolean', 'single-select', 'multi-select', 'internal')),
  help_text  TEXT,
  required   BOOLEAN,
  options    JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY questions_select_active ON questions
  FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY questions_insert_admin ON questions
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY questions_update_admin ON questions
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY questions_delete_admin ON questions
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX questions_deleted_at_idx ON questions (deleted_at);

CREATE TABLE tasks (
  id          UUID        PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT,
  notes       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_select_active ON tasks
  FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY tasks_insert_admin ON tasks
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY tasks_update_admin ON tasks
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY tasks_delete_admin ON tasks
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX tasks_deleted_at_idx ON tasks (deleted_at);

CREATE TABLE workflows (
  id          UUID        PRIMARY KEY,
  name        TEXT        NOT NULL,
  description TEXT,
  version     INTEGER     NOT NULL,
  tags        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  notes       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflows_select_active ON workflows
  FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY workflows_insert_admin ON workflows
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY workflows_update_admin ON workflows
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY workflows_delete_admin ON workflows
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX workflows_deleted_at_idx ON workflows (deleted_at);

CREATE TABLE workflow_tasks (
  workflow_id UUID    NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  task_id     UUID    NOT NULL REFERENCES tasks(id) ON DELETE RESTRICT,
  sequence    INTEGER NOT NULL,
  PRIMARY KEY (workflow_id, task_id)
);

ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflow_tasks_select ON workflow_tasks
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY workflow_tasks_insert_admin ON workflow_tasks
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY workflow_tasks_delete_admin ON workflow_tasks
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX workflow_tasks_task_id_idx ON workflow_tasks (task_id);

CREATE TABLE task_questions (
  task_id     UUID    NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  question_id UUID    NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  sequence    INTEGER NOT NULL,
  PRIMARY KEY (task_id, question_id)
);

ALTER TABLE task_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY task_questions_select ON task_questions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY task_questions_insert_admin ON task_questions
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY task_questions_delete_admin ON task_questions
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX task_questions_question_id_idx ON task_questions (question_id);

-- =============================================================================
-- Jobs
-- =============================================================================

CREATE TABLE jobs (
  id          UUID        PRIMARY KEY,
  customer_id UUID        NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status      TEXT        NOT NULL
                          CONSTRAINT jobs_status_check
                          CHECK (status IN (
                            'open', 'assessing', 'planning', 'preparing',
                            'executing', 'finalizing', 'closed', 'cancelled'
                          )),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY jobs_select_active ON jobs
  FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY jobs_insert_sales ON jobs
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales'));

CREATE POLICY jobs_update_sales ON jobs
  FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('administrator', 'sales'));

CREATE POLICY jobs_delete_admin ON jobs
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX jobs_customer_id_idx ON jobs (customer_id);
CREATE INDEX jobs_deleted_at_idx ON jobs (deleted_at);

CREATE TABLE job_assessments (
  id          UUID        PRIMARY KEY,
  job_id      UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  assessor_id UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  locations   JSONB       NOT NULL DEFAULT '[]'::jsonb,
  risks       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  notes       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

ALTER TABLE job_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_assessments_select_active ON job_assessments
  FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY job_assessments_insert_ops ON job_assessments
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE POLICY job_assessments_update_ops ON job_assessments
  FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE POLICY job_assessments_delete_admin ON job_assessments
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX job_assessments_job_id_idx ON job_assessments (job_id);
CREATE INDEX job_assessments_assessor_id_idx ON job_assessments (assessor_id);
CREATE INDEX job_assessments_deleted_at_idx ON job_assessments (deleted_at);

CREATE TABLE job_workflows (
  id                   UUID        PRIMARY KEY,
  job_id               UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  basis_workflow_id    UUID        NOT NULL REFERENCES workflows(id) ON DELETE RESTRICT,
  modified_workflow_id UUID        REFERENCES workflows(id) ON DELETE RESTRICT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at           TIMESTAMPTZ
);

ALTER TABLE job_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_workflows_select_active ON job_workflows
  FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY job_workflows_insert_ops ON job_workflows
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE POLICY job_workflows_update_ops ON job_workflows
  FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE POLICY job_workflows_delete_admin ON job_workflows
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX job_workflows_job_id_idx ON job_workflows (job_id);
CREATE INDEX job_workflows_basis_workflow_id_idx ON job_workflows (basis_workflow_id);
CREATE INDEX job_workflows_modified_workflow_id_idx ON job_workflows (modified_workflow_id);
CREATE INDEX job_workflows_deleted_at_idx ON job_workflows (deleted_at);

CREATE TABLE job_plans (
  id              UUID        PRIMARY KEY,
  job_id          UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end   TIMESTAMPTZ,
  notes           JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

ALTER TABLE job_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_plans_select_active ON job_plans
  FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY job_plans_insert_ops ON job_plans
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE POLICY job_plans_update_ops ON job_plans
  FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE POLICY job_plans_delete_admin ON job_plans
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX job_plans_job_id_idx ON job_plans (job_id);
CREATE INDEX job_plans_deleted_at_idx ON job_plans (deleted_at);

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

ALTER TABLE job_plan_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_plan_assignments_select_active ON job_plan_assignments
  FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY job_plan_assignments_insert_ops ON job_plan_assignments
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE POLICY job_plan_assignments_update_ops ON job_plan_assignments
  FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE POLICY job_plan_assignments_delete_admin ON job_plan_assignments
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX job_plan_assignments_plan_id_idx ON job_plan_assignments (plan_id);
CREATE INDEX job_plan_assignments_user_id_idx ON job_plan_assignments (user_id);
CREATE INDEX job_plan_assignments_deleted_at_idx ON job_plan_assignments (deleted_at);

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

ALTER TABLE job_plan_chemicals ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_plan_chemicals_select_active ON job_plan_chemicals
  FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY job_plan_chemicals_insert_ops ON job_plan_chemicals
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE POLICY job_plan_chemicals_update_ops ON job_plan_chemicals
  FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE POLICY job_plan_chemicals_delete_admin ON job_plan_chemicals
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX job_plan_chemicals_plan_id_idx ON job_plan_chemicals (plan_id);
CREATE INDEX job_plan_chemicals_chemical_id_idx ON job_plan_chemicals (chemical_id);
CREATE INDEX job_plan_chemicals_deleted_at_idx ON job_plan_chemicals (deleted_at);

CREATE TABLE job_plan_assets (
  plan_id  UUID NOT NULL REFERENCES job_plans(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  PRIMARY KEY (plan_id, asset_id)
);

ALTER TABLE job_plan_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_plan_assets_select ON job_plan_assets
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY job_plan_assets_insert_ops ON job_plan_assets
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE POLICY job_plan_assets_delete_ops ON job_plan_assets
  FOR DELETE
  USING (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE INDEX job_plan_assets_asset_id_idx ON job_plan_assets (asset_id);

CREATE TABLE job_work (
  id            UUID        PRIMARY KEY,
  job_id        UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  started_by_id UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  work          JSONB       NOT NULL DEFAULT '[]'::jsonb,
  started_at    TIMESTAMPTZ NOT NULL,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

ALTER TABLE job_work ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_work_select_active ON job_work
  FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY job_work_insert_ops ON job_work
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'operations'));

CREATE POLICY job_work_update_ops ON job_work
  FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('administrator', 'operations'));

CREATE POLICY job_work_delete_admin ON job_work
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX job_work_job_id_idx ON job_work (job_id);
CREATE INDEX job_work_started_by_id_idx ON job_work (started_by_id);
CREATE INDEX job_work_deleted_at_idx ON job_work (deleted_at);

CREATE TABLE job_work_log_entries (
  id         UUID        PRIMARY KEY,
  job_id     UUID        NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  answer     JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE job_work_log_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_work_log_entries_select_own ON job_work_log_entries
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY job_work_log_entries_select_roles ON job_work_log_entries
  FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE POLICY job_work_log_entries_insert_ops ON job_work_log_entries
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('administrator', 'operations')
    AND (auth.jwt() ->> 'role' = 'administrator' OR user_id = auth.uid())
  );

CREATE INDEX job_work_log_entries_job_id_idx ON job_work_log_entries (job_id);
CREATE INDEX job_work_log_entries_user_id_idx ON job_work_log_entries (user_id);
CREATE INDEX job_work_log_entries_created_at_idx ON job_work_log_entries (created_at);

-- =============================================================================
-- Seed Data
-- =============================================================================

INSERT INTO users (id, display_name, primary_email, phone_number, roles, status)
VALUES (
  '00000000-0000-7000-8000-000000000001',
  'DevOps Admin',
  'devops-admin@swarmag.com',
  '',
  '["administrator"]'::jsonb,
  'active'
);

INSERT INTO asset_types (id, label, active)
VALUES ('019cb02a-243a-7518-8f56-b36ebe1e6a45', 'Transport Truck', true);

INSERT INTO asset_types (id, label, active)
VALUES ('019cb02a-243b-7896-a19e-029a0739b359', 'Transport Trailer', true);

INSERT INTO asset_types (id, label, active)
VALUES ('019cb02a-243b-7859-8b5b-6c46714c51d5', 'Skidsteer Vehicle', true);

INSERT INTO asset_types (id, label, active)
VALUES ('019cb02a-243b-7fbe-99e9-38da0528b22c', 'Toolcat Vehicle', true);

INSERT INTO asset_types (id, label, active)
VALUES ('019cb02a-243b-7d90-b015-d7cf8ba58a2f', 'Vehicle Tool Attachment', true);

INSERT INTO asset_types (id, label, active)
VALUES ('019cb02a-243b-7d19-89d0-11b387b05517', 'Mapping Drone', true);

INSERT INTO asset_types (id, label, active)
VALUES ('019cb02a-243b-7f8c-89f0-a859d4f88e62', 'Dispensing Drone', true);

INSERT INTO asset_types (id, label, active)
VALUES ('019cb02a-243c-7a67-839d-53dfa0e29698', 'Drone Spray Tank', true);

INSERT INTO asset_types (id, label, active)
VALUES ('019cb02a-243c-7ddf-8b6b-a5952bac66d6', 'Drone Granular Hopper', true);

INSERT INTO services (id, name, sku, category)
VALUES ('019cb02a-243c-7926-82ac-60b8dd988f2e', 'Pesticide, Herbicide', 'A-CHEM-01', 'aerial-drone-services');

INSERT INTO services (id, name, sku, category)
VALUES ('019cb02a-243c-750b-8715-89bba9238f0c', 'Fertilizer', 'A-CHEM-02', 'aerial-drone-services');

INSERT INTO services (id, name, sku, category)
VALUES ('019cb02a-243c-7350-8e35-a8baffd9ade3', 'Seed', 'A-SEED-01', 'aerial-drone-services');

INSERT INTO services (id, name, sku, category)
VALUES ('019cb02a-243c-7190-bfa4-df5ea9aa7d88', 'Pond Weeds & Algae', 'A-CHEM-03', 'aerial-drone-services');

INSERT INTO services (id, name, sku, category)
VALUES ('019cb02a-243c-73b4-8bf1-c63f03b6ab7c', 'Pond Feeding', 'A-FEED-01', 'aerial-drone-services');

INSERT INTO services (id, name, sku, category)
VALUES ('019cb02a-243c-7165-ba66-ee5a6cae99f0', 'Precision Mapping', 'A-MAP-01', 'aerial-drone-services');

INSERT INTO services (id, name, sku, category)
VALUES ('019cb02a-243c-74d6-9c74-d3dded62e688', 'Mesquite Herbicide', 'A-CHEM-04', 'aerial-drone-services');

INSERT INTO services (id, name, sku, category)
VALUES ('019cb02a-243c-7db5-98f0-5fa4fd41b814', 'Commercial Greenhouse Painting', 'A-PAINT-01', 'aerial-drone-services');

INSERT INTO services (id, name, sku, category)
VALUES ('019cb02a-243c-7c3f-9c11-404dc6ff9452', 'Mesquite, Hackberry, et al Removal', 'G-MITI-01', 'ground-machinery-services');

INSERT INTO services (id, name, sku, category)
VALUES ('019cb02a-243c-78ba-8a06-284a089cdfc8', 'Fence-line Tree Trimming', 'G-FENCE-01', 'ground-machinery-services');

INSERT INTO services (id, name, sku, category)
VALUES ('019cb02a-243d-7bc0-a812-fd0c8c1bde2d', 'Rock Removal, Regrade', 'G-MACH-01', 'ground-machinery-services');

INSERT INTO services (id, name, sku, category)
VALUES ('019cb02a-243d-7e0d-8b64-3d90441cc86b', 'Brush Hogging', 'G-BRUSH-01', 'ground-machinery-services');

INSERT INTO questions (id, prompt, type, options)
VALUES ('019cb02a-243d-7aa6-8155-d3c04fba64c5', 'telemetry.gps.latitude', 'internal', '[]'::jsonb);

INSERT INTO questions (id, prompt, type, options)
VALUES ('019cb02a-243d-714c-bd46-057f55ea4f8d', 'telemetry.gps.longitude', 'internal', '[]'::jsonb);

INSERT INTO questions (id, prompt, type, options)
VALUES ('019cb02a-243d-7aea-837b-ec815e3d2d99', 'telemetry.gps.altitude', 'internal', '[]'::jsonb);

INSERT INTO questions (id, prompt, type, options)
VALUES ('019cb02a-243d-7922-8014-956c403f43ff', 'telemetry.gps.accuracy', 'internal', '[]'::jsonb);

INSERT INTO questions (id, prompt, type, options)
VALUES ('019cb02a-243d-7f8b-9c6d-8880765364b1', 'telemetry.battery.percent', 'internal', '[]'::jsonb);

INSERT INTO questions (id, prompt, type, options)
VALUES ('019cb02a-243d-7f0f-8db2-abf2bd7237f5', 'telemetry.battery.voltage', 'internal', '[]'::jsonb);

INSERT INTO questions (id, prompt, type, options)
VALUES ('019cb02a-243d-7620-a175-11fbac5ddad1', 'telemetry.environment.temperatureCelsius', 'internal', '[]'::jsonb);

INSERT INTO questions (id, prompt, type, options)
VALUES ('019cb02a-243d-7d7e-8f70-89d229f8411a', 'telemetry.environment.windSpeedMph', 'internal', '[]'::jsonb);

INSERT INTO questions (id, prompt, type, options)
VALUES ('019cb02a-243d-719e-a586-7b9b1e4778a2', 'telemetry.environment.windDirection', 'internal', '[]'::jsonb);

INSERT INTO questions (id, prompt, type, options)
VALUES ('019cb02a-243d-7f99-b22b-dff58e6ec708', 'telemetry.environment.humidityPercent', 'internal', '[]'::jsonb);

INSERT INTO questions (id, prompt, type, options)
VALUES ('019cb02a-243d-7506-a339-82bdf122aeaf', 'execution.durationSeconds', 'internal', '[]'::jsonb);

INSERT INTO questions (id, prompt, type, options)
VALUES ('019cb02a-243d-79e7-9d23-c4abc7c73c19', 'execution.crewCount', 'internal', '[]'::jsonb);

INSERT INTO questions (id, prompt, type, options)
VALUES ('019cb02a-243d-78bd-ab34-f5534d4c6c4e', 'response.skipped', 'internal', '[]'::jsonb);

INSERT INTO questions (id, prompt, type, options)
VALUES ('019cb02a-243d-7f38-9bab-ecdbb30dcf91', 'response.skipReason', 'internal', '[]'::jsonb);

