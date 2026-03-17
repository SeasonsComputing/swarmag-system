-- =============================================================================
-- swarmAg System — Canonical Schema
-- source/domain/schema/schema.sql
--
-- Authoritative current-state DDL. Generated from domain model.
-- Do not edit manually — regenerate from domain model.
-- Includes canonical seed data known at schema time.
-- Migrations in source/back/migrations/ express deltas from this state.
-- =============================================================================

-- ──────────────────────────────────────────────────────────────────────────────────────
-- drop_tables
-- ──────────────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS job_plan_assets CASCADE;
DROP TABLE IF EXISTS service_required_asset_types CASCADE;
DROP TABLE IF EXISTS task_questions CASCADE;
DROP TABLE IF EXISTS workflow_tasks CASCADE;
DROP TABLE IF EXISTS job_work_log_entries CASCADE;
DROP TABLE IF EXISTS job_work CASCADE;
DROP TABLE IF EXISTS job_plan_chemicals CASCADE;
DROP TABLE IF EXISTS job_plan_assignments CASCADE;
DROP TABLE IF EXISTS job_plans CASCADE;
DROP TABLE IF EXISTS job_workflows CASCADE;
DROP TABLE IF EXISTS job_assessments CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS workflows CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS chemicals CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS asset_types CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ──────────────────────────────────────────────────────────────────────────────────────
-- users
-- ──────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id UUID PRIMARY KEY,
  roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_name TEXT NOT NULL,
  primary_email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive')),
  CONSTRAINT users_roles_array_check CHECK (jsonb_typeof(roles) = 'array'),
  CONSTRAINT users_roles_non_empty_check CHECK (jsonb_array_length(roles) > 0)
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_active" ON users
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "users_insert_all" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_update_all" ON users
  FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (true);

CREATE POLICY "users_delete_all" ON users
  FOR DELETE USING (deleted_at IS NULL);

CREATE INDEX users_deleted_at_idx ON users (deleted_at);

-- ──────────────────────────────────────────────────────────────────────────────────────
-- asset_types_assets
-- ──────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE asset_types (
  id UUID PRIMARY KEY,
  label TEXT NOT NULL,
  active BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE asset_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asset_types_select_active" ON asset_types
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "asset_types_insert_all" ON asset_types
  FOR INSERT WITH CHECK (true);

CREATE POLICY "asset_types_update_all" ON asset_types
  FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (true);

CREATE POLICY "asset_types_delete_all" ON asset_types
  FOR DELETE USING (deleted_at IS NULL);

CREATE INDEX asset_types_deleted_at_idx ON asset_types (deleted_at);

CREATE TABLE assets (
  id UUID PRIMARY KEY,
  type_id UUID NOT NULL REFERENCES asset_types(id) ON DELETE RESTRICT,
  notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  label TEXT NOT NULL,
  description TEXT,
  serial_number TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT assets_status_check CHECK (status IN ('active', 'maintenance', 'retired', 'reserved')),
  CONSTRAINT assets_notes_array_check CHECK (jsonb_typeof(notes) = 'array')
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets_select_active" ON assets
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "assets_insert_all" ON assets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "assets_update_all" ON assets
  FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (true);

CREATE POLICY "assets_delete_all" ON assets
  FOR DELETE USING (deleted_at IS NULL);

CREATE INDEX assets_type_id_idx ON assets (type_id);

CREATE INDEX assets_deleted_at_idx ON assets (deleted_at);

-- ──────────────────────────────────────────────────────────────────────────────────────
-- chemicals
-- ──────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE chemicals (
  id UUID PRIMARY KEY,
  labels JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  name TEXT NOT NULL,
  epa_number TEXT,
  usage TEXT NOT NULL,
  signal_word TEXT NOT NULL,
  restricted_use BOOLEAN NOT NULL,
  re_entry_interval_hours INTEGER,
  storage_location TEXT,
  sds_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chemicals_usage_check CHECK (usage IN (
    'herbicide',
    'pesticide',
    'fertilizer',
    'fungicide',
    'adjuvant'
  )),
  CONSTRAINT chemicals_signal_word_check CHECK (signal_word IN ('none', 'danger', 'warning', 'caution')),
  CONSTRAINT chemicals_labels_array_check CHECK (jsonb_typeof(labels) = 'array'),
  CONSTRAINT chemicals_notes_array_check CHECK (jsonb_typeof(notes) = 'array')
);

ALTER TABLE chemicals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chemicals_select_active" ON chemicals
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "chemicals_insert_all" ON chemicals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "chemicals_update_all" ON chemicals
  FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (true);

CREATE POLICY "chemicals_delete_all" ON chemicals
  FOR DELETE USING (deleted_at IS NULL);

CREATE INDEX chemicals_deleted_at_idx ON chemicals (deleted_at);

-- ──────────────────────────────────────────────────────────────────────────────────────
-- customers
-- ──────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE customers (
  id UUID PRIMARY KEY,
  account_manager_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  sites JSONB NOT NULL DEFAULT '[]'::jsonb,
  contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  line_1 TEXT NOT NULL,
  line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT customers_status_check CHECK (status IN ('active', 'inactive', 'prospect')),
  CONSTRAINT customers_sites_array_check CHECK (jsonb_typeof(sites) = 'array'),
  CONSTRAINT customers_contacts_array_check CHECK (jsonb_typeof(contacts) = 'array'),
  CONSTRAINT customers_contacts_non_empty_check CHECK (jsonb_array_length(contacts) > 0),
  CONSTRAINT customers_notes_array_check CHECK (jsonb_typeof(notes) = 'array')
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select_active" ON customers
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "customers_insert_all" ON customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "customers_update_all" ON customers
  FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (true);

CREATE POLICY "customers_delete_all" ON customers
  FOR DELETE USING (deleted_at IS NULL);

CREATE INDEX customers_account_manager_id_idx ON customers (account_manager_id);

CREATE INDEX customers_deleted_at_idx ON customers (deleted_at);

-- ──────────────────────────────────────────────────────────────────────────────────────
-- services
-- ──────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE services (
  id UUID PRIMARY KEY,
  notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags_workflow_candidates JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT services_category_check CHECK (category IN (
    'aerial-drone-services',
    'ground-machinery-services'
  )),
  CONSTRAINT services_notes_array_check CHECK (jsonb_typeof(notes) = 'array'),
  CONSTRAINT services_tags_workflow_candidates_array_check CHECK (
    jsonb_typeof(tags_workflow_candidates) = 'array'
  )
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select_active" ON services
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "services_insert_all" ON services
  FOR INSERT WITH CHECK (true);

CREATE POLICY "services_update_all" ON services
  FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (true);

CREATE POLICY "services_delete_all" ON services
  FOR DELETE USING (deleted_at IS NULL);

CREATE INDEX services_deleted_at_idx ON services (deleted_at);

CREATE TABLE service_required_asset_types (
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  asset_type_id UUID NOT NULL REFERENCES asset_types(id) ON DELETE RESTRICT,
  PRIMARY KEY (service_id, asset_type_id)
);

ALTER TABLE service_required_asset_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_required_asset_types_select_all" ON service_required_asset_types
  FOR SELECT USING (true);

CREATE POLICY "service_required_asset_types_insert_all" ON service_required_asset_types
  FOR INSERT WITH CHECK (true);

CREATE POLICY "service_required_asset_types_delete_all" ON service_required_asset_types
  FOR DELETE USING (true);

CREATE INDEX service_required_asset_types_service_id_idx ON service_required_asset_types (service_id);

CREATE INDEX service_required_asset_types_asset_type_id_idx ON service_required_asset_types (asset_type_id);

-- ──────────────────────────────────────────────────────────────────────────────────────
-- workflows_tasks_questions
-- ──────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE workflows (
  id UUID PRIMARY KEY,
  notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT workflows_notes_array_check CHECK (jsonb_typeof(notes) = 'array'),
  CONSTRAINT workflows_tags_array_check CHECK (jsonb_typeof(tags) = 'array')
);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflows_select_active" ON workflows
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "workflows_insert_all" ON workflows
  FOR INSERT WITH CHECK (true);

CREATE POLICY "workflows_update_all" ON workflows
  FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (true);

CREATE POLICY "workflows_delete_all" ON workflows
  FOR DELETE USING (deleted_at IS NULL);

CREATE INDEX workflows_deleted_at_idx ON workflows (deleted_at);

CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT tasks_notes_array_check CHECK (jsonb_typeof(notes) = 'array')
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_active" ON tasks
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "tasks_insert_all" ON tasks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "tasks_update_all" ON tasks
  FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (true);

CREATE POLICY "tasks_delete_all" ON tasks
  FOR DELETE USING (deleted_at IS NULL);

CREATE INDEX tasks_deleted_at_idx ON tasks (deleted_at);

CREATE TABLE questions (
  id UUID PRIMARY KEY,
  prompt TEXT NOT NULL,
  type TEXT NOT NULL,
  help_text TEXT,
  required BOOLEAN,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT questions_type_check CHECK (type IN (
    'internal',
    'text',
    'number',
    'boolean',
    'single-select',
    'multi-select'
  )),
  CONSTRAINT questions_options_array_check CHECK (jsonb_typeof(options) = 'array'),
  CONSTRAINT questions_options_variant_check CHECK (
    (type IN ('single-select', 'multi-select') AND jsonb_array_length(options) > 0)
    OR (type IN ('internal', 'text', 'number', 'boolean'))
  )
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_select_active" ON questions
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "questions_insert_all" ON questions
  FOR INSERT WITH CHECK (deleted_at IS NULL);

CREATE POLICY "questions_update_all" ON questions
  FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (true);

CREATE POLICY "questions_delete_all" ON questions
  FOR DELETE USING (deleted_at IS NULL);

CREATE INDEX questions_deleted_at_idx ON questions (deleted_at);

CREATE TABLE workflow_tasks (
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE RESTRICT,
  sequence INTEGER NOT NULL,
  PRIMARY KEY (workflow_id, task_id)
);

ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_tasks_select_all" ON workflow_tasks
  FOR SELECT USING (true);

CREATE POLICY "workflow_tasks_insert_all" ON workflow_tasks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "workflow_tasks_delete_all" ON workflow_tasks
  FOR DELETE USING (true);

CREATE INDEX workflow_tasks_workflow_id_idx ON workflow_tasks (workflow_id);

CREATE INDEX workflow_tasks_task_id_idx ON workflow_tasks (task_id);

CREATE TABLE task_questions (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  sequence INTEGER NOT NULL,
  PRIMARY KEY (task_id, question_id)
);

ALTER TABLE task_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_questions_select_all" ON task_questions
  FOR SELECT USING (true);

CREATE POLICY "task_questions_insert_all" ON task_questions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "task_questions_delete_all" ON task_questions
  FOR DELETE USING (true);

CREATE INDEX task_questions_task_id_idx ON task_questions (task_id);

CREATE INDEX task_questions_question_id_idx ON task_questions (question_id);

-- ──────────────────────────────────────────────────────────────────────────────────────
-- jobs
-- ──────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT jobs_status_check CHECK (status IN (
    'open',
    'assessing',
    'planning',
    'preparing',
    'executing',
    'finalizing',
    'closed',
    'cancelled'
  ))
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_select_active" ON jobs
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "jobs_insert_all" ON jobs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "jobs_update_all" ON jobs
  FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (true);

CREATE POLICY "jobs_delete_all" ON jobs
  FOR DELETE USING (deleted_at IS NULL);

CREATE INDEX jobs_customer_id_idx ON jobs (customer_id);

CREATE INDEX jobs_deleted_at_idx ON jobs (deleted_at);

CREATE TABLE job_assessments (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  assessor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  locations JSONB NOT NULL DEFAULT '[]'::jsonb,
  risks JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT job_assessments_locations_array_check CHECK (jsonb_typeof(locations) = 'array'),
  CONSTRAINT job_assessments_locations_non_empty_check CHECK (jsonb_array_length(locations) > 0),
  CONSTRAINT job_assessments_risks_array_check CHECK (jsonb_typeof(risks) = 'array'),
  CONSTRAINT job_assessments_notes_array_check CHECK (jsonb_typeof(notes) = 'array')
);

ALTER TABLE job_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_assessments_select_active" ON job_assessments
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "job_assessments_insert_all" ON job_assessments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "job_assessments_update_all" ON job_assessments
  FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (true);

CREATE POLICY "job_assessments_delete_all" ON job_assessments
  FOR DELETE USING (deleted_at IS NULL);

CREATE INDEX job_assessments_job_id_idx ON job_assessments (job_id);

CREATE INDEX job_assessments_assessor_id_idx ON job_assessments (assessor_id);

CREATE INDEX job_assessments_deleted_at_idx ON job_assessments (deleted_at);

CREATE TABLE job_workflows (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  basis_workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE RESTRICT,
  modified_workflow_id UUID REFERENCES workflows(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE job_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_workflows_select_active" ON job_workflows
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "job_workflows_insert_all" ON job_workflows
  FOR INSERT WITH CHECK (true);

CREATE POLICY "job_workflows_update_all" ON job_workflows
  FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (true);

CREATE POLICY "job_workflows_delete_all" ON job_workflows
  FOR DELETE USING (deleted_at IS NULL);

CREATE INDEX job_workflows_job_id_idx ON job_workflows (job_id);

CREATE INDEX job_workflows_basis_workflow_id_idx ON job_workflows (basis_workflow_id);

CREATE INDEX job_workflows_modified_workflow_id_idx ON job_workflows (modified_workflow_id);

CREATE INDEX job_workflows_deleted_at_idx ON job_workflows (deleted_at);

CREATE TABLE job_plans (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  planner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  scheduled_start TIMESTAMPTZ NOT NULL,
  duration_estimate NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT job_plans_notes_array_check CHECK (jsonb_typeof(notes) = 'array')
);

ALTER TABLE job_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_plans_select_active" ON job_plans
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "job_plans_insert_all" ON job_plans
  FOR INSERT WITH CHECK (true);

CREATE POLICY "job_plans_update_all" ON job_plans
  FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (true);

CREATE POLICY "job_plans_delete_all" ON job_plans
  FOR DELETE USING (deleted_at IS NULL);

CREATE INDEX job_plans_job_id_idx ON job_plans (job_id);

CREATE INDEX job_plans_planner_id_idx ON job_plans (planner_id);

CREATE INDEX job_plans_deleted_at_idx ON job_plans (deleted_at);

CREATE TABLE job_plan_assignments (
  id UUID PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES job_plans(id) ON DELETE CASCADE,
  crew_member_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT job_plan_assignments_role_check CHECK (
    role IN ('administrator', 'sales', 'operations')
  ),
  CONSTRAINT job_plan_assignments_notes_array_check CHECK (jsonb_typeof(notes) = 'array')
);

ALTER TABLE job_plan_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_plan_assignments_select_active" ON job_plan_assignments
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "job_plan_assignments_insert_all" ON job_plan_assignments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "job_plan_assignments_update_all" ON job_plan_assignments
  FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (true);

CREATE POLICY "job_plan_assignments_delete_all" ON job_plan_assignments
  FOR DELETE USING (deleted_at IS NULL);

CREATE INDEX job_plan_assignments_plan_id_idx ON job_plan_assignments (plan_id);

CREATE INDEX job_plan_assignments_crew_member_id_idx ON job_plan_assignments (crew_member_id);

CREATE INDEX job_plan_assignments_deleted_at_idx ON job_plan_assignments (deleted_at);

CREATE TABLE job_plan_chemicals (
  id UUID PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES job_plans(id) ON DELETE CASCADE,
  chemical_id UUID NOT NULL REFERENCES chemicals(id) ON DELETE RESTRICT,
  amount NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  target_area NUMERIC,
  target_area_unit TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT job_plan_chemicals_unit_check CHECK (unit IN ('gallon', 'liter', 'pound', 'kilogram')),
  CONSTRAINT job_plan_chemicals_target_area_unit_check CHECK (target_area_unit IN ('acre', 'hectare'))
);

ALTER TABLE job_plan_chemicals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_plan_chemicals_select_active" ON job_plan_chemicals
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "job_plan_chemicals_insert_all" ON job_plan_chemicals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "job_plan_chemicals_update_all" ON job_plan_chemicals
  FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (true);

CREATE POLICY "job_plan_chemicals_delete_all" ON job_plan_chemicals
  FOR DELETE USING (deleted_at IS NULL);

CREATE INDEX job_plan_chemicals_plan_id_idx ON job_plan_chemicals (plan_id);

CREATE INDEX job_plan_chemicals_chemical_id_idx ON job_plan_chemicals (chemical_id);

CREATE INDEX job_plan_chemicals_deleted_at_idx ON job_plan_chemicals (deleted_at);

CREATE TABLE job_plan_assets (
  plan_id UUID NOT NULL REFERENCES job_plans(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  PRIMARY KEY (plan_id, asset_id)
);

ALTER TABLE job_plan_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_plan_assets_select_all" ON job_plan_assets
  FOR SELECT USING (true);

CREATE POLICY "job_plan_assets_insert_all" ON job_plan_assets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "job_plan_assets_delete_all" ON job_plan_assets
  FOR DELETE USING (true);

CREATE INDEX job_plan_assets_plan_id_idx ON job_plan_assets (plan_id);

CREATE INDEX job_plan_assets_asset_id_idx ON job_plan_assets (asset_id);

CREATE TABLE job_work (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  started_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  work JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT job_work_work_array_check CHECK (jsonb_typeof(work) = 'array'),
  CONSTRAINT job_work_work_non_empty_check CHECK (jsonb_array_length(work) > 0)
);

ALTER TABLE job_work ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_work_select_active" ON job_work
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "job_work_insert_all" ON job_work
  FOR INSERT WITH CHECK (true);

CREATE POLICY "job_work_update_all" ON job_work
  FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (true);

CREATE POLICY "job_work_delete_all" ON job_work
  FOR DELETE USING (deleted_at IS NULL);

CREATE INDEX job_work_job_id_idx ON job_work (job_id);

CREATE INDEX job_work_started_by_id_idx ON job_work (started_by_id);

CREATE INDEX job_work_deleted_at_idx ON job_work (deleted_at);

CREATE TABLE job_work_log_entries (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  answer JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT job_work_log_entries_answer_array_check CHECK (jsonb_typeof(answer) = 'array'),
  CONSTRAINT job_work_log_entries_answer_non_empty_check CHECK (jsonb_array_length(answer) > 0)
);

ALTER TABLE job_work_log_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_work_log_entries_select_all" ON job_work_log_entries
  FOR SELECT USING (true);

CREATE POLICY "job_work_log_entries_insert_all" ON job_work_log_entries
  FOR INSERT WITH CHECK (true);

CREATE INDEX job_work_log_entries_job_id_idx ON job_work_log_entries (job_id);

CREATE INDEX job_work_log_entries_user_id_idx ON job_work_log_entries (user_id);

-- ──────────────────────────────────────────────────────────────────────────────────────
-- seed_data
-- ──────────────────────────────────────────────────────────────────────────────────────

INSERT INTO users (
  id,
  roles,
  display_name,
  primary_email,
  phone_number,
  avatar_url,
  status,
  created_at,
  updated_at,
  deleted_at
) VALUES (
  '0195b5b0-3c09-79f0-8d7c-0a1b2c3d4e5f',
  '["administrator"]'::jsonb,
  'DevOps Admin',
  'devops-admin@swarmag.com',
  '+1-000-000-0000',
  NULL,
  'active',
  now(),
  now(),
  NULL
);

INSERT INTO asset_types (id, label, active, created_at, updated_at, deleted_at) VALUES
  ('0195b5b0-3c10-7a21-8a8f-1d2c3b4a5e61', 'Transport Truck', true, now(), now(), NULL),
  ('0195b5b0-3c11-7b32-9c4d-2e3f4a5b6c72', 'Transport Trailer', true, now(), now(), NULL),
  ('0195b5b0-3c12-7c43-a15e-3f4a5b6c7d83', 'Skidsteer Vehicle', true, now(), now(), NULL),
  ('0195b5b0-3c13-7d54-b26f-4a5b6c7d8e94', 'Toolcat Vehicle', true, now(), now(), NULL),
  ('0195b5b0-3c14-7e65-8b70-5b6c7d8e9fa5', 'Vehicle Tool Attachment', true, now(), now(), NULL),
  ('0195b5b0-3c15-7f76-9c81-6c7d8e9fa0b6', 'Mapping Drone', true, now(), now(), NULL),
  ('0195b5b0-3c16-7a87-ad92-7d8e9fa0b1c7', 'Dispensing Drone', true, now(), now(), NULL),
  ('0195b5b0-3c17-7b98-bea3-8e9fa0b1c2d8', 'Drone Spray Tank', true, now(), now(), NULL),
  ('0195b5b0-3c18-7ca9-8fb4-9fa0b1c2d3e9', 'Drone Granular Hopper', true, now(), now(), NULL);

INSERT INTO services (
  id,
  notes,
  name,
  sku,
  description,
  category,
  tags_workflow_candidates,
  created_at,
  updated_at,
  deleted_at
) VALUES
  (
    '0195b5b0-3c19-7dba-90c5-a0b1c2d3e4f0',
    '[]'::jsonb,
    'Pesticide, Herbicide',
    'A-CHEM-01',
    'Pesticide, Herbicide',
    'aerial-drone-services',
    '[]'::jsonb,
    now(),
    now(),
    NULL
  ),
  (
    '0195b5b0-3c1a-7ecb-a1d6-b1c2d3e4f501',
    '[]'::jsonb,
    'Fertilizer',
    'A-CHEM-02',
    'Fertilizer',
    'aerial-drone-services',
    '[]'::jsonb,
    now(),
    now(),
    NULL
  ),
  (
    '0195b5b0-3c1b-7fdc-b2e7-c2d3e4f50612',
    '[]'::jsonb,
    'Seed',
    'A-SEED-01',
    'Seed',
    'aerial-drone-services',
    '[]'::jsonb,
    now(),
    now(),
    NULL
  ),
  (
    '0195b5b0-3c1c-7aed-83f8-d3e4f5061723',
    '[]'::jsonb,
    'Pond Weeds & Algae',
    'A-CHEM-03',
    'Pond Weeds & Algae',
    'aerial-drone-services',
    '[]'::jsonb,
    now(),
    now(),
    NULL
  ),
  (
    '0195b5b0-3c1d-7bfe-94a9-e4f506172834',
    '[]'::jsonb,
    'Pond Feeding',
    'A-FEED-01',
    'Pond Feeding',
    'aerial-drone-services',
    '[]'::jsonb,
    now(),
    now(),
    NULL
  ),
  (
    '0195b5b0-3c1e-7c0f-a5ba-f50617283945',
    '[]'::jsonb,
    'Precision Mapping',
    'A-MAP-01',
    'Precision Mapping',
    'aerial-drone-services',
    '[]'::jsonb,
    now(),
    now(),
    NULL
  ),
  (
    '0195b5b0-3c1f-7d10-b6cb-061728394a56',
    '[]'::jsonb,
    'Mesquite Herbicide',
    'A-CHEM-04',
    'Mesquite Herbicide',
    'aerial-drone-services',
    '[]'::jsonb,
    now(),
    now(),
    NULL
  ),
  (
    '0195b5b0-3c20-7e21-87dc-1728394a5b67',
    '[]'::jsonb,
    'Commercial Greenhouse Painting',
    'A-PAINT-01',
    'Commercial Greenhouse Painting',
    'aerial-drone-services',
    '[]'::jsonb,
    now(),
    now(),
    NULL
  ),
  (
    '0195b5b0-3c21-7f32-98ed-28394a5b6c78',
    '[]'::jsonb,
    'Mesquite, Hackberry, et al Removal',
    'G-MITI-01',
    'Mesquite, Hackberry, et al Removal',
    'ground-machinery-services',
    '[]'::jsonb,
    now(),
    now(),
    NULL
  ),
  (
    '0195b5b0-3c22-7a43-a9fe-394a5b6c7d89',
    '[]'::jsonb,
    'Fence-line Tree Trimming',
    'G-FENCE-01',
    'Fence-line Tree Trimming',
    'ground-machinery-services',
    '[]'::jsonb,
    now(),
    now(),
    NULL
  ),
  (
    '0195b5b0-3c23-7b54-b10f-4a5b6c7d8e9a',
    '[]'::jsonb,
    'Rock Removal, Regrade',
    'G-MACH-01',
    'Rock Removal, Regrade',
    'ground-machinery-services',
    '[]'::jsonb,
    now(),
    now(),
    NULL
  ),
  (
    '0195b5b0-3c24-7c65-821a-5b6c7d8e9fab',
    '[]'::jsonb,
    'Brush Hogging',
    'G-BRUSH-01',
    'Brush Hogging',
    'ground-machinery-services',
    '[]'::jsonb,
    now(),
    now(),
    NULL
  );

INSERT INTO questions (
  id,
  prompt,
  type,
  help_text,
  required,
  options,
  created_at,
  updated_at,
  deleted_at
) VALUES
  ('0195b5b0-3c25-7d76-932b-6c7d8e9fa0bc', 'telemetry.gps.latitude', 'internal', 'number', true, '[]'::jsonb, now(), now(), NULL),
  ('0195b5b0-3c26-7e87-a43c-7d8e9fa0b1cd', 'telemetry.gps.longitude', 'internal', 'number', true, '[]'::jsonb, now(), now(), NULL),
  ('0195b5b0-3c27-7f98-b54d-8e9fa0b1c2de', 'telemetry.gps.altitude', 'internal', 'number', true, '[]'::jsonb, now(), now(), NULL),
  ('0195b5b0-3c28-7aa9-865e-9fa0b1c2d3ef', 'telemetry.gps.accuracy', 'internal', 'number', true, '[]'::jsonb, now(), now(), NULL),
  ('0195b5b0-3c29-7bba-976f-a0b1c2d3e4f1', 'telemetry.battery.percent', 'internal', 'number', true, '[]'::jsonb, now(), now(), NULL),
  ('0195b5b0-3c2a-7ccb-a870-b1c2d3e4f512', 'telemetry.battery.voltage', 'internal', 'number', true, '[]'::jsonb, now(), now(), NULL),
  ('0195b5b0-3c2b-7ddc-b981-c2d3e4f50623', 'telemetry.environment.temperatureCelsius', 'internal', 'number', true, '[]'::jsonb, now(), now(), NULL),
  ('0195b5b0-3c2c-7eed-8a92-d3e4f5061734', 'telemetry.environment.windSpeedMph', 'internal', 'number', true, '[]'::jsonb, now(), now(), NULL),
  ('0195b5b0-3c2d-7ffe-9ba3-e4f506172845', 'telemetry.environment.windDirection', 'internal', 'text', true, '[]'::jsonb, now(), now(), NULL),
  ('0195b5b0-3c2e-7a0f-acb4-f50617283956', 'telemetry.environment.humidityPercent', 'internal', 'number', true, '[]'::jsonb, now(), now(), NULL),
  ('0195b5b0-3c2f-7b10-bdc5-061728394a67', 'execution.durationSeconds', 'internal', 'number', true, '[]'::jsonb, now(), now(), NULL),
  ('0195b5b0-3c30-7c21-8ed6-1728394a5b78', 'execution.crewCount', 'internal', 'number', true, '[]'::jsonb, now(), now(), NULL),
  ('0195b5b0-3c31-7d32-9fe7-28394a5b6c89', 'response.skipped', 'internal', 'boolean', true, '[]'::jsonb, now(), now(), NULL),
  ('0195b5b0-3c32-7e43-a0f8-394a5b6c7d9a', 'response.skipReason', 'internal', 'text', true, '[]'::jsonb, now(), now(), NULL);
