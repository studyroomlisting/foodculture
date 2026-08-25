-- ============================================================================
-- MIGRATION 006 — Milestone 1 Full Spec: Auth completion
-- Run after migration_005_search.sql
-- ============================================================================

-- ─── Terms & conditions / privacy acceptance tracking ────────────────────────
alter table profiles
  add column if not exists terms_accepted_at     timestamptz,
  add column if not exists privacy_accepted_at   timestamptz,
  add column if not exists terms_version         text default '1.0',
  add column if not exists remember_me           boolean default false;

-- ─── Account lockout & failed login tracking ──────────────────────────────────
alter table profiles
  add column if not exists failed_login_count    int     default 0,
  add column if not exists last_failed_login_at  timestamptz,
  add column if not exists locked_at             timestamptz,
  add column if not exists locked_reason         text;

-- ─── Influencer role column (profiles.role CHECK constraint) ─────────────────
-- The existing check constraint on profiles.role must be updated to allow 'influencer'
-- First drop existing constraint, then recreate with extended values
alter table profiles
  drop constraint if exists profiles_role_check;

alter table profiles
  add constraint profiles_role_check
    check (role in ('visitor','owner','influencer','admin'));

-- ─── Audit log extension: add more event types ────────────────────────────────
comment on table audit_logs is
  'Immutable audit trail. Supported actions: auth.register, auth.login, auth.logout,
   auth.login_failed, auth.account_locked, auth.email_verified, auth.profile_created,
   auth.password_reset, auth.terms_accepted, listing.approved, listing.rejected';

-- ─── Indexes for lockout queries (performance) ────────────────────────────────
create index if not exists idx_profiles_locked_at
  on profiles(locked_at) where locked_at is not null;

create index if not exists idx_profiles_failed_login
  on profiles(failed_login_count) where failed_login_count > 0;

-- ─── Function: record_login_attempt (called from auth callback) ───────────────
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

-- ─── Function: check_account_locked ──────────────────────────────────────────
create or replace function is_account_locked(p_user_id uuid)
returns boolean as $$
  select locked_at is not null
  from profiles
  where id = p_user_id;
$$ language sql security definer stable set search_path = public;

-- ─── Verification ─────────────────────────────────────────────────────────────
-- select column_name, data_type from information_schema.columns
-- where table_name = 'profiles' order by ordinal_position;

-- ─── Update handle_new_user to store T&C acceptance timestamps ───────────────
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
