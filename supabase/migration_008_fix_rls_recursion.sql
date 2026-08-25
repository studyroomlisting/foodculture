-- ============================================================================
-- MIGRATION 008 — Fix "infinite recursion detected in policy for relation
-- profiles" (Restaurants / Trending / Explore / Deals pages returned empty
-- for anon users, while Influencers worked, because only Influencers avoided
-- touching profiles/restaurants RLS).
--
-- Root cause: the "admins read all profiles" SELECT policy on `profiles`
-- checked `user_roles`, and `user_roles`'s own "admins manage roles" policy
-- checked `profiles` back again — profiles -> user_roles -> profiles -> ...
-- Any query touching `restaurants` (whose policies also check `profiles` for
-- admin access) walked straight into that loop and Postgres aborted with
-- "infinite recursion detected in policy for relation \"profiles\"".
--
-- Fix: a single SECURITY DEFINER helper (`is_admin()`) that reads `user_roles`
-- bypassing RLS internally, so nothing re-enters policy evaluation. Only the
-- one recursive SELECT policy on `profiles` needs to change — every other
-- table's "is this user an admin" check already goes through `profiles`, and
-- once that lookup is safe, they resolve safely too.
--
-- Run AFTER migration_007_profiles.sql.
-- ============================================================================

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from user_roles where user_id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "admins read all profiles" on profiles;
create policy "admins read all profiles" on profiles for select using (is_admin());
