create table if not exists public.services (
  id uuid primary key,
  name text not null,
  sku text not null,
  description text,
  category text not null check (category in ('aerial-drone-services', 'ground-machinery-services')),
  required_asset_types jsonb not null default '[]'::jsonb,
  notes jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  payload jsonb
);

create unique index if not exists services_sku_idx on public.services (sku);
create index if not exists services_category_idx on public.services (category);
