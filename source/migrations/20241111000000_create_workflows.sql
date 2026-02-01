create table if not exists public.workflows (
  id uuid primary key,
  service_id uuid not null references public.services (id),
  name text not null,
  description text,
  version integer not null default 1,
  effective_from timestamptz not null,
  steps jsonb not null default '[]'::jsonb,
  locations_required jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  payload jsonb
);

create index if not exists workflows_service_id_idx on public.workflows (service_id);
create index if not exists workflows_effective_from_idx on public.workflows (effective_from);
create unique index if not exists workflows_service_version_idx on public.workflows (service_id, version);
