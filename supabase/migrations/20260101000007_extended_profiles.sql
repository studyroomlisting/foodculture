-- ============================================================================
-- MIGRATION 007 — Milestone 2 Full Spec: Extended profile columns
-- Run after migration_006_auth_complete.sql
-- ============================================================================

-- ─── Extended profile fields ──────────────────────────────────────────────────
alter table profiles
  add column if not exists username              text unique,
  add column if not exists date_of_birth         date,
  add column if not exists gender                text check (gender in ('male','female','non_binary','prefer_not_to_say')),
  add column if not exists preferred_language    text default 'en',
  add column if not exists state                 text,
  add column if not exists country               text default 'India',
  add column if not exists dietary_preferences   text[] default '{}',
  add column if not exists preferred_search_radius int default 10,
  add column if not exists favourite_restaurant_ids uuid[] default '{}',
  add column if not exists favourite_influencer_ids uuid[] default '{}';

-- ─── Influencer-specific profile extension ────────────────────────────────────
alter table profiles
  add column if not exists influencer_youtube    text,
  add column if not exists influencer_tiktok     text,
  add column if not exists influencer_blog       text,
  add column if not exists content_types         text[] default '{}',
  add column if not exists audience_size_range   text check (audience_size_range in ('micro','mid','macro','mega'));

-- ─── Notification preferences extended (jsonb default) ───────────────────────
-- Update existing default to include all notification types
alter table profiles
  alter column notification_prefs
    set default '{
      "email_notifications": true,
      "push_notifications": true,
      "influencer_posts": true,
      "enquiries": true,
      "ai_scores": true,
      "deals_expiry": true,
      "marketing": false,
      "weekly_digest": true,
      "collaboration_notifications": true,
      "restaurant_updates": true,
      "trending_food_alerts": true
    }';

-- ─── Username index ────────────────────────────────────────────────────────────
create unique index if not exists idx_profiles_username
  on profiles(lower(username)) where username is not null;

-- ─── Dietary preferences index ────────────────────────────────────────────────
create index if not exists idx_profiles_dietary_prefs
  on profiles using gin(dietary_preferences);

-- ─── Verify ───────────────────────────────────────────────────────────────────
-- select column_name, data_type from information_schema.columns
-- where table_name = 'profiles' order by ordinal_position;

-- ─── saved_searches table ─────────────────────────────────────────────────────
create table if not exists saved_searches (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  query         text not null,
  filters       jsonb default '{}',
  created_at    timestamptz default now()
);
alter table saved_searches enable row level security;
create policy "users manage own saved searches" on saved_searches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_saved_searches_user on saved_searches(user_id, created_at desc);

-- ─── recently_viewed table ────────────────────────────────────────────────────
create table if not exists recently_viewed (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  entity_type    text not null check (entity_type in ('restaurant','influencer')),
  entity_id      uuid not null,
  viewed_at      timestamptz default now()
);
alter table recently_viewed enable row level security;
create policy "users manage own recently viewed" on recently_viewed
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_recently_viewed_user on recently_viewed(user_id, viewed_at desc);
create unique index if not exists idx_recently_viewed_unique
  on recently_viewed(user_id, entity_type, entity_id);

-- ─── user_sessions view (from Supabase auth) ──────────────────────────────────
-- Supabase manages sessions in auth.sessions — expose via audit_logs filter
-- No separate table needed; login_history already captured in audit_logs

-- ─── profile.email_verified flag + deactivated_at ────────────────────────────
alter table profiles
  add column if not exists deactivated_at   timestamptz,
  add column if not exists deactivation_reason text,
  add column if not exists profile_public   boolean default true,
  add column if not exists show_email       boolean default false,
  add column if not exists show_phone       boolean default false,
  add column if not exists allow_dm         boolean default true;

-- ─── M16: Admin user management columns ──────────────────────────────────────
alter table profiles
  add column if not exists suspended_at      timestamptz,
  add column if not exists suspended_reason  text,
  add column if not exists suspended_by      uuid references profiles(id),
  add column if not exists is_deleted        boolean default false,
  add column if not exists deleted_at        timestamptz,
  add column if not exists admin_notes       text;

create index if not exists idx_profiles_suspended on profiles(suspended_at) where suspended_at is not null;
create index if not exists idx_profiles_role      on profiles(role);
create index if not exists idx_profiles_deleted   on profiles(is_deleted) where is_deleted = true;

-- ─── Fix listing_status default for existing databases ────────────────────────
-- IMPORTANT: Run this if your database was created before this fix.
-- Changes the default so new listings require admin approval before going live.
alter table restaurants alter column listing_status set default 'draft';

-- Add CHECK constraint if not already present
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'restaurants_listing_status_check'
  ) then
    alter table restaurants
      add constraint restaurants_listing_status_check
        check (listing_status in ('draft','pending_review','approved','rejected','suspended'));
  end if;
end $$;

-- Fix any restaurants that were auto-approved with no owner (seed data is fine)
-- update restaurants set listing_status = 'draft' where owner_id is null and listing_status = 'approved';

-- ─── Influencer Analytics Tables ─────────────────────────────────────────────

-- Daily analytics snapshots for trend charts
create table if not exists influencer_analytics (
  id              uuid primary key default gen_random_uuid(),
  influencer_id   uuid not null references influencers(id) on delete cascade,
  date            date not null default current_date,
  followers_count int  default 0,
  total_views     int  default 0,
  total_likes     int  default 0,
  total_comments  int  default 0,
  visits_driven   int  default 0,
  posts_count     int  default 0,
  engagement_rate numeric(5,2) default 0,
  created_at      timestamptz default now(),
  unique (influencer_id, date)
);
alter table influencer_analytics enable row level security;
create policy "influencers read own analytics" on influencer_analytics
  for select using (
    influencer_id in (
      select id from influencers where handle = (
        select instagram_handle from profiles where id = auth.uid()
      )
    ) or (select role from profiles where id = auth.uid()) = 'admin'
  );
create index if not exists idx_influencer_analytics_id_date
  on influencer_analytics(influencer_id, date desc);

-- Campaign / collaboration tracking
create table if not exists influencer_campaigns (
  id              uuid primary key default gen_random_uuid(),
  influencer_id   uuid not null references influencers(id) on delete cascade,
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  campaign_name   text,
  status          text default 'active' check (status in ('active','completed','cancelled')),
  start_date      date,
  end_date        date,
  agreed_fee      numeric(10,2),
  deliverables    text,
  notes           text,
  created_at      timestamptz default now()
);
alter table influencer_campaigns enable row level security;
create policy "influencers read own campaigns" on influencer_campaigns
  for select using (auth.uid() is not null);
create index if not exists idx_campaigns_influencer on influencer_campaigns(influencer_id);

-- Add rank tracking to influencers
alter table influencers
  add column if not exists rank_this_week  int,
  add column if not exists rank_last_week  int,
  add column if not exists total_visits_all_time int default 0,
  add column if not exists total_views_all_time  bigint default 0;
