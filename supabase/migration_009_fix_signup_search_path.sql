-- ============================================================================
-- MIGRATION 009 — Fix "Database error saving new user" on signup
-- (Google OAuth AND email/password both broken — Postgres logs showed:
--  relation "profiles" does not exist (SQLSTATE 42P01), inside
--  handle_new_user())
--
-- Root cause: handle_new_user() (and record_login_success/is_account_locked)
-- are SECURITY DEFINER functions but never set search_path. Supabase's auth
-- service connects with a role whose default search_path does not include
-- `public`, so the unqualified `profiles` / `audit_logs` references inside
-- these functions fail to resolve — even though those tables exist. This is
-- a well-known Postgres/Supabase gotcha with SECURITY DEFINER functions.
--
-- Fix: re-create each function with `set search_path = public` pinned on the
-- function itself, so it resolves `profiles`/`audit_logs` correctly no
-- matter which role or session calls it. Body is otherwise byte-for-byte the
-- same as the version currently live (from migration_006_auth_complete.sql)
-- — `create or replace function` swaps the implementation in place; the
-- existing `on_auth_user_created` trigger picks it up automatically.
--
-- Run AFTER migration_008_fix_rls_recursion.sql.
-- ============================================================================

create or replace function handle_new_user()
returns trigger as $$
declare
  v_role text;
  v_terms_accepted_at timestamptz;
  v_privacy_accepted_at timestamptz;
begin
  -- Extract role, default to 'visitor'
  v_role := coalesce(
    new.raw_user_meta_data->>'role',
    'visitor'
  );
  -- Validate role is allowed
  if v_role not in ('visitor','owner','influencer','admin') then
    v_role := 'visitor';
  end if;

  -- Extract acceptance timestamps
  v_terms_accepted_at   := (new.raw_user_meta_data->>'terms_accepted_at')::timestamptz;
  v_privacy_accepted_at := (new.raw_user_meta_data->>'privacy_accepted_at')::timestamptz;

  insert into profiles (
    id, full_name, avatar_url, role,
    terms_accepted_at, privacy_accepted_at, terms_version,
    onboarding_role
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    v_role,
    v_terms_accepted_at,
    v_privacy_accepted_at,
    '1.0',
    v_role
  )
  on conflict (id) do update
    set
      full_name             = coalesce(excluded.full_name, profiles.full_name),
      avatar_url            = coalesce(excluded.avatar_url, profiles.avatar_url),
      terms_accepted_at     = coalesce(excluded.terms_accepted_at, profiles.terms_accepted_at),
      privacy_accepted_at   = coalesce(excluded.privacy_accepted_at, profiles.privacy_accepted_at),
      role = case
               when profiles.role is null or profiles.role = ''
               then excluded.role
               else profiles.role
             end;

  -- Audit: registration event
  insert into audit_logs (actor_id, action, target_table, target_id, metadata)
  values (
    new.id,
    'auth.register',
    'auth.users',
    new.id,
    jsonb_build_object(
      'role', v_role,
      'provider', new.raw_app_meta_data->>'provider',
      'terms_accepted', v_terms_accepted_at is not null,
      'privacy_accepted', v_privacy_accepted_at is not null
    )
  );

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function record_login_success(p_user_id uuid)
returns void as $$
begin
  update profiles
  set failed_login_count = 0,
      last_failed_login_at = null,
      locked_at = null,
      locked_reason = null
  where id = p_user_id;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function is_account_locked(p_user_id uuid)
returns boolean as $$
  select locked_at is not null
  from profiles
  where id = p_user_id;
$$ language sql security definer stable set search_path = public;

-- ─────────────────────────────────────────────────────────────────────────
-- Second, related bug: profiles.onboarding_role only allowed ('visitor',
-- 'owner') (from migration_004_onboarding.sql), but migration_006 later
-- added 'influencer' as a valid profiles.role AND handle_new_user() now
-- sets onboarding_role = role for influencers too. Anyone picking
-- "Food Creator" at signup hits the same "Database error saving new user"
-- via this constraint instead. Widen it to match the role check.
-- ─────────────────────────────────────────────────────────────────────────
alter table profiles
  drop constraint if exists profiles_onboarding_role_check;

alter table profiles
  add constraint profiles_onboarding_role_check
    check (onboarding_role in ('visitor','owner','influencer'));
