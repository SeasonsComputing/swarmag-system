-- Baseline schema derived from source/domain abstractions

create table public.users (
  id uuid primary key,
  display_name text not null,
  primary_email text not null,
  phone_number text not null,
  avatar_url text,
  roles jsonb,
  status text check (status in ('active', 'inactive')),
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz
);

create table public.services (
  id uuid primary key,
  name text not null,
  sku text not null,
  description text,
  category text not null check (category in ('aerial-drone-services', 'ground-machinery-services')),
  notes jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table public.asset_types (
  id uuid primary key,
  label text not null,
  active boolean not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table public.assets (
  id uuid primary key,
  label text not null,
  description text,
  serial_number text,
  type uuid not null references public.asset_types (id),
  status text not null check (status in ('active', 'maintenance', 'retired', 'reserved')),
  attachments jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table public.chemicals (
  id uuid primary key,
  name text not null,
  epa_number text,
  usage text not null check (usage in ('herbicide', 'pesticide', 'fertilizer', 'fungicide', 'adjuvant')),
  signal_word text check (signal_word in ('danger', 'warning', 'caution')),
  restricted_use boolean not null,
  re_entry_interval_hours integer,
  storage_location text,
  sds_url text,
  labels jsonb,
  attachments jsonb,
  notes jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table public.customers (
  id uuid primary key,
  name text not null,
  status text not null check (status in ('active', 'inactive', 'prospect')),
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null,
  account_manager_id uuid references public.users (id),
  primary_contact_id uuid,
  sites jsonb not null,
  contacts jsonb not null,
  notes jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  check (jsonb_typeof(sites) = 'array'),
  check (jsonb_typeof(contacts) = 'array' and jsonb_array_length(contacts) > 0)
);

create table public.workflows (
  id uuid primary key,
  service_id uuid not null references public.services (id),
  name text not null,
  description text,
  version integer not null,
  effective_from timestamptz not null,
  steps jsonb not null,
  locations_required jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) > 0)
);

create table public.jobs (
  id uuid primary key,
  customer_id uuid not null references public.customers (id),
  service_id uuid not null references public.services (id),
  status text not null check (status in ('draft', 'ready', 'scheduled', 'in-progress', 'completed', 'cancelled')),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table public.job_assessments (
  id uuid primary key,
  job_id uuid not null references public.jobs (id),
  assessor_id uuid not null references public.users (id),
  locations jsonb not null,
  questions jsonb not null,
  risks jsonb,
  notes jsonb,
  attachments jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  check (jsonb_typeof(locations) = 'array' and jsonb_array_length(locations) > 0),
  check (jsonb_typeof(questions) = 'array')
);

create table public.job_plans (
  id uuid primary key,
  job_id uuid not null references public.jobs (id),
  workflow_id uuid not null references public.workflows (id),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz,
  target_locations jsonb not null,
  notes jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  check (jsonb_typeof(target_locations) = 'array')
);

create table public.job_logs (
  id uuid primary key,
  job_id uuid not null references public.jobs (id),
  type text not null check (type in ('status', 'checkpoint', 'note', 'telemetry', 'exception')),
  message text not null,
  occurred_at timestamptz not null,
  created_at timestamptz not null,
  created_by_id uuid not null references public.users (id),
  location jsonb,
  attachments jsonb,
  payload jsonb
);

create table public.service_required_asset_types (
  service_id uuid not null references public.services (id),
  asset_type_id uuid not null references public.asset_types (id),
  deleted_at timestamptz,
  primary key (service_id, asset_type_id)
);

create table public.job_plan_assignments (
  plan_id uuid not null references public.job_plans (id),
  user_id uuid not null references public.users (id),
  role text not null,
  notes text,
  deleted_at timestamptz,
  primary key (plan_id, user_id)
);

create table public.job_plan_assets (
  plan_id uuid not null references public.job_plans (id),
  asset_id uuid not null references public.assets (id),
  deleted_at timestamptz,
  primary key (plan_id, asset_id)
);

create table public.job_plan_chemicals (
  plan_id uuid not null references public.job_plans (id),
  chemical_id uuid not null references public.chemicals (id),
  amount numeric not null,
  unit text not null check (unit in ('gallon', 'liter', 'pound', 'kilogram')),
  target_area numeric,
  target_area_unit text check (target_area_unit in ('acre', 'hectare')),
  deleted_at timestamptz,
  primary key (plan_id, chemical_id)
);
