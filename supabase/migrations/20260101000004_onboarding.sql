-- ============================================================================
-- MIGRATION 004 — Milestone 2: User Onboarding preferences
-- Run after migration_003_security.sql
-- ============================================================================

-- ─── Add preference columns to profiles ──────────────────────────────────────
alter table profiles
  add column if not exists preferred_cuisines   text[]     default '{}',
  add column if not exists preferred_zone_ids   uuid[]     default '{}',
  add column if not exists notification_prefs   jsonb      default '{"influencer_posts":true,"enquiries":true,"ai_scores":true,"deals_expiry":true,"marketing":false,"weekly_digest":true}',
  add column if not exists onboarding_role      text       check (onboarding_role in ('visitor','owner')),
  add column if not exists bio                  text,
  add column if not exists instagram_handle     text;

-- ─── Add visitor-specific columns to onboarding_progress ─────────────────────
alter table onboarding_progress
  add column if not exists step_welcome_seen        boolean default false,
  add column if not exists step_cuisines_selected   boolean default false,
  add column if not exists step_location_selected   boolean default false,
  add column if not exists step_notifs_configured   boolean default false,
  add column if not exists current_step             int     default 1,
  add column if not exists flow_type                text    default 'owner' check (flow_type in ('visitor','owner'));

-- ─── Index for profile preference lookups ────────────────────────────────────
create index if not exists idx_profiles_preferred_cuisines on profiles using gin(preferred_cuisines);
create index if not exists idx_profiles_preferred_zones    on profiles using gin(preferred_zone_ids);

-- ─── RLS: profiles columns are owned by the user ─────────────────────────────
-- Already covered by existing "users update own profile" policy with WITH CHECK
-- New columns (preferred_cuisines etc.) are allowed since they are not role/status

-- ─── Verification query (run to confirm) ─────────────────────────────────────
-- select column_name, data_type, column_default
-- from information_schema.columns
-- where table_name = 'profiles'
-- order by ordinal_position;
