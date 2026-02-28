-- =============================================================================
-- swarmAg System — Canonical Schema
-- source/domain/schema/schema.sql
--
-- Authoritative current-state DDL. Generated from domain.md.
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
DROP TABLE IF EXISTS workflows;
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

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_active ON users
  FOR SELECT
  USING (deleted_at IS NULL);

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

CREATE INDEX users_deleted_at_idx ON users (deleted_at);

-- =============================================================================
-- Asset Types & Assets
-- =============================================================================

CREATE TABLE asset_types (
  id         UUID        PRIMARY KEY,
  label      TEXT        NOT NULL,
  active     BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE asset_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY asset_types_select_active ON asset_types
  FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY asset_types_insert_admin ON asset_types
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY asset_types_update_admin ON asset_types
  FOR UPDATE
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
  USING (deleted_at IS NULL);

CREATE POLICY assets_insert_admin ON assets
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY assets_update_admin ON assets
  FOR UPDATE
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
  restricted_use          BOOLEAN     NOT NULL DEFAULT false,
  re_entry_interval_hours NUMERIC,
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
  USING (deleted_at IS NULL);

CREATE POLICY chemicals_insert_admin ON chemicals
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY chemicals_update_admin ON chemicals
  FOR UPDATE
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
  USING (deleted_at IS NULL);

CREATE POLICY customers_select_managed ON customers
  FOR SELECT
  USING (account_manager_id = auth.uid());

CREATE POLICY customers_insert_sales ON customers
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales'));

CREATE POLICY customers_update_managed ON customers
  FOR UPDATE
  USING (account_manager_id = auth.uid() OR auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX customers_account_manager_id_idx ON customers (account_manager_id);
CREATE INDEX customers_deleted_at_idx ON customers (deleted_at);

-- =============================================================================
-- Services
-- =============================================================================

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

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY services_select_active ON services
  FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY services_insert_admin ON services
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY services_update_admin ON services
  FOR UPDATE
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
  USING (true);

CREATE POLICY service_required_asset_types_insert_admin ON service_required_asset_types
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY service_required_asset_types_delete_admin ON service_required_asset_types
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX service_required_asset_types_asset_type_id_idx ON service_required_asset_types (asset_type_id);

-- =============================================================================
-- Workflows
-- =============================================================================

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

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflows_select_active ON workflows
  FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY workflows_insert_admin ON workflows
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY workflows_update_admin ON workflows
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE INDEX workflows_deleted_at_idx ON workflows (deleted_at);

-- =============================================================================
-- Jobs
-- =============================================================================

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

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY jobs_select_active ON jobs
  FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY jobs_insert_sales ON jobs
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales'));

CREATE POLICY jobs_update_sales ON jobs
  FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('administrator', 'sales'));

CREATE INDEX jobs_customer_id_idx ON jobs (customer_id);
CREATE INDEX jobs_status_idx ON jobs (status);
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
  USING (deleted_at IS NULL);

CREATE POLICY job_assessments_insert_ops ON job_assessments
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE POLICY job_assessments_update_ops ON job_assessments
  FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE INDEX job_assessments_job_id_idx ON job_assessments (job_id);
CREATE INDEX job_assessments_assessor_id_idx ON job_assessments (assessor_id);
CREATE INDEX job_assessments_deleted_at_idx ON job_assessments (deleted_at);

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

ALTER TABLE job_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_workflows_select_active ON job_workflows
  FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY job_workflows_insert_ops ON job_workflows
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE POLICY job_workflows_update_ops ON job_workflows
  FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

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
  USING (deleted_at IS NULL);

CREATE POLICY job_plans_insert_ops ON job_plans
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE POLICY job_plans_update_ops ON job_plans
  FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

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
  USING (deleted_at IS NULL);

CREATE POLICY job_plan_assignments_insert_ops ON job_plan_assignments
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE POLICY job_plan_assignments_update_ops ON job_plan_assignments
  FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

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
  USING (deleted_at IS NULL);

CREATE POLICY job_plan_chemicals_insert_ops ON job_plan_chemicals
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

CREATE POLICY job_plan_chemicals_update_ops ON job_plan_chemicals
  FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('administrator', 'sales', 'operations'));

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
  USING (true);

CREATE POLICY job_plan_assets_insert_ops ON job_plan_assets
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('administrator', 'operations'));

CREATE POLICY job_plan_assets_delete_ops ON job_plan_assets
  FOR DELETE
  USING (auth.jwt() ->> 'role' IN ('administrator', 'operations'));

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
  USING (deleted_at IS NULL);

CREATE POLICY job_work_insert_ops ON job_work
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'operations');

CREATE POLICY job_work_update_ops ON job_work
  FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('administrator', 'operations'));

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

CREATE POLICY job_work_log_entries_select_ops ON job_work_log_entries
  FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('administrator', 'operations'));

CREATE POLICY job_work_log_entries_insert_ops ON job_work_log_entries
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'operations' AND user_id = auth.uid());

CREATE INDEX job_work_log_entries_job_id_idx ON job_work_log_entries (job_id);
CREATE INDEX job_work_log_entries_user_id_idx ON job_work_log_entries (user_id);
CREATE INDEX job_work_log_entries_created_at_idx ON job_work_log_entries (created_at);

-- =============================================================================
-- Seed Data
-- =============================================================================

-- Seed ID assignment: 019ca1aa-4aa0-7aed-b032-17cb3f638578
INSERT INTO users (id, display_name, primary_email, phone_number, roles, status)
VALUES (
  '019ca1aa-4aa0-7aed-b032-17cb3f638578',
  'DevOps Admin',
  'devops-admin@swarmag.com',
  '',
  '["administrator"]'::jsonb,
  'active'
)
ON CONFLICT (id) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  primary_email = EXCLUDED.primary_email,
  phone_number = EXCLUDED.phone_number,
  roles = EXCLUDED.roles,
  status = EXCLUDED.status;


-- Seed ID assignment: 019ca1aa-4aa1-7d8d-9765-4c15af94cddf
INSERT INTO asset_types (id, label, active)
VALUES ('019ca1aa-4aa1-7d8d-9765-4c15af94cddf', 'Transport Truck', true)
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, active = EXCLUDED.active;


-- Seed ID assignment: 019ca1aa-4aa1-7f54-b187-4d0d87038fd5
INSERT INTO asset_types (id, label, active)
VALUES ('019ca1aa-4aa1-7f54-b187-4d0d87038fd5', 'Transport Trailer', true)
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, active = EXCLUDED.active;


-- Seed ID assignment: 019ca1aa-4aa1-7bf4-b876-277bd97a3f4c
INSERT INTO asset_types (id, label, active)
VALUES ('019ca1aa-4aa1-7bf4-b876-277bd97a3f4c', 'Skidsteer Vehicle', true)
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, active = EXCLUDED.active;


-- Seed ID assignment: 019ca1aa-4aa2-75f4-9f29-e32f929a4b29
INSERT INTO asset_types (id, label, active)
VALUES ('019ca1aa-4aa2-75f4-9f29-e32f929a4b29', 'Toolcat Vehicle', true)
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, active = EXCLUDED.active;


-- Seed ID assignment: 019ca1aa-4aa2-7ecf-9330-6292e9c4c889
INSERT INTO asset_types (id, label, active)
VALUES ('019ca1aa-4aa2-7ecf-9330-6292e9c4c889', 'Vehicle Tool Attachment', true)
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, active = EXCLUDED.active;


-- Seed ID assignment: 019ca1aa-4aa2-7328-9c0b-9cb55e6710ad
INSERT INTO asset_types (id, label, active)
VALUES ('019ca1aa-4aa2-7328-9c0b-9cb55e6710ad', 'Mapping Drone', true)
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, active = EXCLUDED.active;


-- Seed ID assignment: 019ca1aa-4aa2-7696-9c66-3613bc317eac
INSERT INTO asset_types (id, label, active)
VALUES ('019ca1aa-4aa2-7696-9c66-3613bc317eac', 'Dispensing Drone', true)
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, active = EXCLUDED.active;


-- Seed ID assignment: 019ca1aa-4aa2-7937-b296-bcfaf46cfd67
INSERT INTO asset_types (id, label, active)
VALUES ('019ca1aa-4aa2-7937-b296-bcfaf46cfd67', 'Drone Spray Tank', true)
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, active = EXCLUDED.active;


-- Seed ID assignment: 019ca1aa-4aa2-7dc8-b442-a166ba4a67fd
INSERT INTO asset_types (id, label, active)
VALUES ('019ca1aa-4aa2-7dc8-b442-a166ba4a67fd', 'Drone Granular Hopper', true)
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, active = EXCLUDED.active;


-- Seed ID assignment: 019ca1aa-4aa2-7989-8feb-02fcb0b317a4
INSERT INTO services (id, name, sku, category)
VALUES ('019ca1aa-4aa2-7989-8feb-02fcb0b317a4', 'Pesticide, Herbicide', 'A-CHEM-01', 'aerial-drone-services')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, sku = EXCLUDED.sku, category = EXCLUDED.category;


-- Seed ID assignment: 019ca1aa-4aa2-7389-98b8-95e2efb6ecff
INSERT INTO services (id, name, sku, category)
VALUES ('019ca1aa-4aa2-7389-98b8-95e2efb6ecff', 'Fertilizer', 'A-CHEM-02', 'aerial-drone-services')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, sku = EXCLUDED.sku, category = EXCLUDED.category;


-- Seed ID assignment: 019ca1aa-4aa2-74dc-93c3-c1a2eb1b1422
INSERT INTO services (id, name, sku, category)
VALUES ('019ca1aa-4aa2-74dc-93c3-c1a2eb1b1422', 'Seed', 'A-SEED-01', 'aerial-drone-services')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, sku = EXCLUDED.sku, category = EXCLUDED.category;


-- Seed ID assignment: 019ca1aa-4aa2-72a3-b9fc-59f8b535533f
INSERT INTO services (id, name, sku, category)
VALUES ('019ca1aa-4aa2-72a3-b9fc-59f8b535533f', 'Pond Weeds & Algae', 'A-CHEM-03', 'aerial-drone-services')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, sku = EXCLUDED.sku, category = EXCLUDED.category;


-- Seed ID assignment: 019ca1aa-4aa2-7917-882e-50fe35ec82dc
INSERT INTO services (id, name, sku, category)
VALUES ('019ca1aa-4aa2-7917-882e-50fe35ec82dc', 'Pond Feeding', 'A-FEED-01', 'aerial-drone-services')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, sku = EXCLUDED.sku, category = EXCLUDED.category;


-- Seed ID assignment: 019ca1aa-4aa2-7586-aa7b-73e0ea1b7998
INSERT INTO services (id, name, sku, category)
VALUES ('019ca1aa-4aa2-7586-aa7b-73e0ea1b7998', 'Precision Mapping', 'A-MAP-01', 'aerial-drone-services')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, sku = EXCLUDED.sku, category = EXCLUDED.category;


-- Seed ID assignment: 019ca1aa-4aa2-7edb-9e2e-a014d32ed4b7
INSERT INTO services (id, name, sku, category)
VALUES ('019ca1aa-4aa2-7edb-9e2e-a014d32ed4b7', 'Mesquite Herbicide', 'A-CHEM-04', 'aerial-drone-services')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, sku = EXCLUDED.sku, category = EXCLUDED.category;


-- Seed ID assignment: 019ca1aa-4aa3-70a6-994b-1bfb7a862df7
INSERT INTO services (id, name, sku, category)
VALUES ('019ca1aa-4aa3-70a6-994b-1bfb7a862df7', 'Commercial Greenhouse Painting', 'A-PAINT-01', 'aerial-drone-services')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, sku = EXCLUDED.sku, category = EXCLUDED.category;


-- Seed ID assignment: 019ca1aa-4aa3-7238-a345-306d184d5953
INSERT INTO services (id, name, sku, category)
VALUES ('019ca1aa-4aa3-7238-a345-306d184d5953', 'Mesquite, Hackberry, et al Removal', 'G-MITI-01', 'ground-machinery-services')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, sku = EXCLUDED.sku, category = EXCLUDED.category;


-- Seed ID assignment: 019ca1aa-4aa3-7125-82aa-3000815e28df
INSERT INTO services (id, name, sku, category)
VALUES ('019ca1aa-4aa3-7125-82aa-3000815e28df', 'Fence-line Tree Trimming', 'G-FENCE-01', 'ground-machinery-services')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, sku = EXCLUDED.sku, category = EXCLUDED.category;


-- Seed ID assignment: 019ca1aa-4aa3-7b12-a909-468331c3e036
INSERT INTO services (id, name, sku, category)
VALUES ('019ca1aa-4aa3-7b12-a909-468331c3e036', 'Rock Removal, Regrade', 'G-MACH-01', 'ground-machinery-services')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, sku = EXCLUDED.sku, category = EXCLUDED.category;


-- Seed ID assignment: 019ca1aa-4aa3-79f0-9fb4-cf704f98618c
INSERT INTO services (id, name, sku, category)
VALUES ('019ca1aa-4aa3-79f0-9fb4-cf704f98618c', 'Brush Hogging', 'G-BRUSH-01', 'ground-machinery-services')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, sku = EXCLUDED.sku, category = EXCLUDED.category;


-- Seed ID assignment: 019ca1aa-4aa3-7f2d-89b3-08f2e71c329f
INSERT INTO workflows (id, name, description, version, tags, tasks)
VALUES (
  '019ca1aa-4aa3-7f2d-89b3-08f2e71c329f',
  'Internal Telemetry Questions',
  'System-generated internal questions for telemetry and operational log entries. Read-only.',
  1,
  '["internal", "system"]'::jsonb,
  '[
    {
      "id": "00000000-0000-7000-8000-000000000200",
      "title": "Internal Telemetry",
      "checklist": [
        {
          "id": "00000000-0000-7000-8000-000000000201",
          "prompt": "telemetry.gps.latitude",
          "type": "internal",
          "required": false,
          "options": []
        },
        {
          "id": "00000000-0000-7000-8000-000000000202",
          "prompt": "telemetry.gps.longitude",
          "type": "internal",
          "required": false,
          "options": []
        },
        {
          "id": "00000000-0000-7000-8000-000000000203",
          "prompt": "telemetry.gps.altitude",
          "type": "internal",
          "required": false,
          "options": []
        },
        {
          "id": "00000000-0000-7000-8000-000000000204",
          "prompt": "telemetry.gps.accuracy",
          "type": "internal",
          "required": false,
          "options": []
        },
        {
          "id": "00000000-0000-7000-8000-000000000205",
          "prompt": "telemetry.battery.percent",
          "type": "internal",
          "required": false,
          "options": []
        },
        {
          "id": "00000000-0000-7000-8000-000000000206",
          "prompt": "telemetry.battery.voltage",
          "type": "internal",
          "required": false,
          "options": []
        },
        {
          "id": "00000000-0000-7000-8000-000000000207",
          "prompt": "telemetry.environment.temperatureCelsius",
          "type": "internal",
          "required": false,
          "options": []
        },
        {
          "id": "00000000-0000-7000-8000-000000000208",
          "prompt": "telemetry.environment.windSpeedMph",
          "type": "internal",
          "required": false,
          "options": []
        },
        {
          "id": "00000000-0000-7000-8000-000000000209",
          "prompt": "telemetry.environment.windDirection",
          "type": "internal",
          "required": false,
          "options": []
        },
        {
          "id": "00000000-0000-7000-8000-000000000210",
          "prompt": "telemetry.environment.humidityPercent",
          "type": "internal",
          "required": false,
          "options": []
        },
        {
          "id": "00000000-0000-7000-8000-000000000211",
          "prompt": "execution.durationSeconds",
          "type": "internal",
          "required": false,
          "options": []
        },
        {
          "id": "00000000-0000-7000-8000-000000000212",
          "prompt": "execution.crewCount",
          "type": "internal",
          "required": false,
          "options": []
        },
        {
          "id": "00000000-0000-7000-8000-000000000213",
          "prompt": "response.skipped",
          "type": "internal",
          "required": false,
          "options": []
        },
        {
          "id": "00000000-0000-7000-8000-000000000214",
          "prompt": "response.skipReason",
          "type": "internal",
          "required": false,
          "options": []
        }
      ]
    }
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  tags = EXCLUDED.tags,
  tasks = EXCLUDED.tasks;

