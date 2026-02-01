-- Job assessments table
create table if not exists public.job_assessments (
  id uuid primary key,
  service_id uuid not null references public.services (id),
  customer_id uuid not null references public.customers (id),
  contact_id uuid,
  assessor_id uuid not null references public.users (id),
  assessed_at timestamptz not null,
  locations jsonb not null,
  questions jsonb not null default '[]'::jsonb,
  risks jsonb,
  notes jsonb,
  attachments jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  payload jsonb
);

create index if not exists job_assessments_service_id_idx on public.job_assessments (service_id);
create index if not exists job_assessments_customer_id_idx on public.job_assessments (customer_id);
create index if not exists job_assessments_assessor_id_idx on public.job_assessments (assessor_id);

-- Job plans table
create table if not exists public.job_plans (
  id uuid primary key,
  job_id uuid not null,
  workflow_id uuid not null references public.workflows (id),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz,
  target_locations jsonb not null default '[]'::jsonb,
  assignments jsonb not null default '[]'::jsonb,
  assets jsonb not null default '[]'::jsonb,
  chemicals jsonb not null default '[]'::jsonb,
  notes jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  payload jsonb
);

create index if not exists job_plans_job_id_idx on public.job_plans (job_id);
create index if not exists job_plans_workflow_id_idx on public.job_plans (workflow_id);
create index if not exists job_plans_scheduled_start_idx on public.job_plans (scheduled_start);

-- Job logs table (append-only)
create table if not exists public.job_logs (
  id uuid primary key,
  job_id uuid not null,
  plan_id uuid not null references public.job_plans (id),
  type text not null check (type in ('status', 'checkpoint', 'note', 'telemetry', 'exception')),
  message text not null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  created_by_id uuid not null references public.users (id),
  location jsonb,
  attachments jsonb,
  payload jsonb
);

create index if not exists job_logs_job_id_idx on public.job_logs (job_id);
create index if not exists job_logs_plan_id_idx on public.job_logs (plan_id);
create index if not exists job_logs_type_idx on public.job_logs (type);
create index if not exists job_logs_occurred_at_idx on public.job_logs (occurred_at);

-- Jobs table
create table if not exists public.jobs (
  id uuid primary key,
  assessment_id uuid not null references public.job_assessments (id),
  plan_id uuid not null references public.job_plans (id),
  service_id uuid not null references public.services (id),
  customer_id uuid not null references public.customers (id),
  status text not null default 'draft' check (status in ('draft', 'ready', 'scheduled', 'in-progress', 'completed', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  payload jsonb
);

create index if not exists jobs_assessment_id_idx on public.jobs (assessment_id);
create index if not exists jobs_plan_id_idx on public.jobs (plan_id);
create index if not exists jobs_service_id_idx on public.jobs (service_id);
create index if not exists jobs_customer_id_idx on public.jobs (customer_id);
create index if not exists jobs_status_idx on public.jobs (status);

-- Add foreign key from job_plans to jobs (circular reference resolved after jobs table exists)
alter table public.job_plans add constraint job_plans_job_id_fkey foreign key (job_id) references public.jobs (id) deferrable initially deferred;

-- Add foreign key from job_logs to jobs
alter table public.job_logs add constraint job_logs_job_id_fkey foreign key (job_id) references public.jobs (id);
