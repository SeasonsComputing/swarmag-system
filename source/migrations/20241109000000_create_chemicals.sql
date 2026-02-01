create table if not exists public.chemicals (
  id uuid primary key,
  name text not null,
  epa_number text,
  usage text not null check (usage in ('herbicide', 'pesticide', 'fertilizer', 'fungicide', 'adjuvant')),
  signal_word text check (signal_word is null or signal_word in ('danger', 'warning', 'caution')),
  restricted_use boolean not null default false,
  re_entry_interval_hours integer,
  storage_location text,
  sds_url text,
  labels jsonb,
  attachments jsonb,
  notes jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  payload jsonb
);

create index if not exists chemicals_usage_idx on public.chemicals (usage);
create index if not exists chemicals_restricted_use_idx on public.chemicals (restricted_use);
