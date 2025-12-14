create table if not exists public.users (
  id uuid primary key,
  display_name text not null,
  primary_email text not null,
  phone_number text not null,
  avatar_url text,
  roles jsonb,
  status text not null default 'active' check (status in ('active', 'inactive')),
  payload jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create unique index if not exists users_primary_email_active_idx
  on public.users (primary_email) where deleted_at is null;

create index if not exists users_deleted_at_idx on public.users (deleted_at);
