-- ===========================================================================
-- 0008_grant_admin.sql
-- Reusable, auditable role-granting helpers built ON TOP OF the existing role
-- system (0003: app_role enum + user_roles + user_accounts + is_admin()).
-- This migration adds NO new role model — it only provides safe functions to
-- grant/revoke roles by email, plus a one-time bootstrap for the FIRST admin.
--
-- WHY FUNCTIONS INSTEAD OF A RAW INSERT:
--  * Keyed by EMAIL (human-friendly) but resolves to the auth.users UUID, so no
--    email is ever hard-coded anywhere in application code.
--  * Records `granted_by` for an audit trail.
--  * SECURITY DEFINER so the grant/revoke path is controlled: after bootstrap,
--    ONLY an existing admin may grant/revoke (checked inside the function).
--  * The one-time bootstrap is guarded: it refuses to run if ANY admin already
--    exists, so it can't be abused to silently seize admin later.
-- ===========================================================================

-- Bootstrap the FIRST admin -------------------------------------------------
-- Call this exactly once, right after you sign up, to make your account the
-- first admin. It is a no-op (raises notice) if an admin already exists, which
-- makes it safe to leave in version control and re-run.
create or replace function public.bootstrap_first_admin(admin_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  existing  integer;
begin
  -- Guard: if any admin already exists, refuse (prevents privilege seizure).
  select count(*) into existing from public.user_roles where role = 'admin';
  if existing > 0 then
    return 'An admin already exists; bootstrap skipped.';
  end if;

  -- Resolve the email to an auth user id.
  select id into target_id from auth.users where email = admin_email;
  if target_id is null then
    return format('No auth user found for %s — sign up first, then re-run.', admin_email);
  end if;

  insert into public.user_roles (user_id, role, granted_by)
  values (target_id, 'admin', target_id)
  on conflict (user_id, role) do nothing;

  return format('Granted admin to %s.', admin_email);
end;
$$;

-- Grant a role to a user by email (admin-only after bootstrap) ---------------
create or replace function public.grant_role(target_email text, new_role public.app_role)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only an admin may grant roles.';
  end if;

  select id into target_id from auth.users where email = target_email;
  if target_id is null then
    return format('No auth user found for %s.', target_email);
  end if;

  insert into public.user_roles (user_id, role, granted_by)
  values (target_id, new_role, auth.uid())
  on conflict (user_id, role) do nothing;

  return format('Granted %s to %s.', new_role, target_email);
end;
$$;

-- Revoke a role from a user by email (admin-only) ---------------------------
create or replace function public.revoke_role(target_email text, old_role public.app_role)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only an admin may revoke roles.';
  end if;

  select id into target_id from auth.users where email = target_email;
  if target_id is null then
    return format('No auth user found for %s.', target_email);
  end if;

  delete from public.user_roles where user_id = target_id and role = old_role;
  return format('Revoked %s from %s.', old_role, target_email);
end;
$$;

-- Execution grants ----------------------------------------------------------
-- bootstrap is intentionally NOT granted to anon/authenticated for API use;
-- it is meant to be run once from the SQL editor (definer rights let it work
-- there). grant_role/revoke_role are safe to expose to authenticated because
-- they self-check is_admin() internally.
revoke all on function public.bootstrap_first_admin(text) from public;
revoke all on function public.grant_role(text, public.app_role) from public;
revoke all on function public.revoke_role(text, public.app_role) from public;
grant execute on function public.grant_role(text, public.app_role) to authenticated;
grant execute on function public.revoke_role(text, public.app_role) to authenticated;
