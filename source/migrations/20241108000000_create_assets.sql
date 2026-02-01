-- Asset types lookup table
create table if not exists public.asset_types (
  id uuid primary key,
  label text not null,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  payload jsonb
);

create unique index if not exists asset_types_label_idx on public.asset_types (label);

-- Assets table
create table if not exists public.assets (
  id uuid primary key,
  label text not null,
  description text,
  serial_number text,
  type uuid not null references public.asset_types (id),
  status text not null default 'active' check (status in ('active', 'maintenance', 'retired', 'reserved')),
  attachments jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  payload jsonb
);

create index if not exists assets_type_idx on public.assets (type);
create index if not exists assets_status_idx on public.assets (status);
