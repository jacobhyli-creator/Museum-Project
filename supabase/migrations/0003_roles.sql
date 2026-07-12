-- ===========================================================================
-- 0003_roles.sql
-- Admin users, roles, and the SECURITY DEFINER helper functions that every
-- RLS policy uses to decide "is the caller an admin?".
--
-- Model:
--  * auth.users (managed by Supabase Auth) is the identity source.
--  * public.user_accounts is our own profile row, 1:1 with auth.users,
--    auto-created on signup by a trigger.
--  * public.user_roles grants named roles ('admin','editor') to a user.
--
-- The helper functions are SECURITY DEFINER + read-only so RLS policies can
-- call them without recursively triggering RLS on user_roles itself.
-- ===========================================================================

-- Role enum -----------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'editor', 'viewer');
  end if;
end$$;

-- User accounts (1:1 with auth.users) ---------------------------------------
-- `saved_history_opt_in` is the master consent flag (spec §36): false means
-- session-only, even for an authenticated user; true means we persist history.
create table if not exists public.user_accounts (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text,
  display_name         text,
  saved_history_opt_in boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create trigger trg_user_accounts_updated
  before update on public.user_accounts
  for each row execute function public.set_updated_at();

-- User roles ----------------------------------------------------------------
create table if not exists public.user_roles (
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       public.app_role not null,
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);
create index if not exists idx_user_roles_user on public.user_roles(user_id);

-- Auto-provision a user_accounts row when a new auth user is created. ---------
-- SECURITY DEFINER so it can insert regardless of RLS. Note: this does NOT
-- grant any role; admin roles are granted explicitly (see setup README).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_accounts (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role check helpers (used by every admin RLS policy) -----------------------
-- SECURITY DEFINER + stable so policies can call them cheaply and without
-- recursively invoking RLS on user_roles.
create or replace function public.has_role(check_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = check_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin');
$$;

-- Admins (and editors) can manage content. Kept separate so you can later
-- restrict editors from, say, ML settings while still letting them edit text.
create or replace function public.can_edit_content()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin') or public.has_role('editor');
$$;

-- Lock down execution: these run as definer, so only let authenticated callers
-- invoke them (anon may still read content via table policies, not via these).
revoke all on function public.has_role(public.app_role) from public;
revoke all on function public.is_admin() from public;
revoke all on function public.can_edit_content() from public;
grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_edit_content() to authenticated;
