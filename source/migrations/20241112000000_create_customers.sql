-- Customers table
create table if not exists public.customers (
  id uuid primary key,
  name text not null,
  status text not null default 'prospect' check (status in ('active', 'inactive', 'prospect')),
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null,
  account_manager_id uuid references public.users (id),
  primary_contact_id uuid,
  sites jsonb not null default '[]'::jsonb,
  contacts jsonb not null default '[]'::jsonb,
  notes jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  payload jsonb
);

create index if not exists customers_status_idx on public.customers (status);
create index if not exists customers_account_manager_id_idx on public.customers (account_manager_id);
