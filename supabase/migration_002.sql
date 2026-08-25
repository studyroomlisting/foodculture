-- ============================================================================
-- FoodCulture AI — Migration 002
-- Adds: profiles, user_roles, saved_listings, listing_images, listing_claims,
--       audit_logs, onboarding_progress, categories, locations, enquiries,
--       review_reports + restaurant status lifecycle update
-- Run AFTER schema.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PROFILES — linked to Supabase auth.users
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  city text default 'Bengaluru',
  role text not null default 'visitor',   -- visitor | owner | admin
  onboarding_complete boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "users read own profile"   on profiles for select using (auth.uid() = id);
create policy "users update own profile" on profiles for update using (auth.uid() = id);
create policy "admins read all profiles" on profiles for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- updated_at trigger for profiles
create trigger trg_profiles_updated_at
before update on profiles
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- USER ROLES — explicit role table for multi-role support
-- ---------------------------------------------------------------------------
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null,                     -- visitor | owner | admin
  granted_by uuid references profiles(id),
  granted_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table user_roles enable row level security;
create policy "admins manage roles" on user_roles for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ---------------------------------------------------------------------------
-- CATEGORIES — for restaurant categorisation + public category pages
-- ---------------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,              -- "Biryani", "Street Food"
  slug text not null unique,              -- "biryani", "street-food"
  emoji text default '🍽️',
  description text,
  restaurant_count int default 0,
  created_at timestamptz not null default now()
);
alter table categories enable row level security;
create policy "public read categories" on categories for select using (true);

-- Restaurant ↔ category (many-to-many)
create table restaurant_categories (
  restaurant_id uuid references restaurants(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (restaurant_id, category_id)
);
alter table restaurant_categories enable row level security;
create policy "public read restaurant_categories" on restaurant_categories for select using (true);

-- ---------------------------------------------------------------------------
-- LOCATIONS — maps to zones, adds public location pages
-- ---------------------------------------------------------------------------
create table locations (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid references zones(id),
  name text not null,                     -- "Koramangala 5th Block"
  slug text not null unique,              -- "koramangala-5th-block"
  description text,
  restaurant_count int default 0,
  created_at timestamptz not null default now()
);
alter table locations enable row level security;
create policy "public read locations" on locations for select using (true);

-- ---------------------------------------------------------------------------
-- RESTAURANT STATUS LIFECYCLE
-- Add listing_status column to restaurants (draft → pending_review → approved | rejected | suspended)
-- ---------------------------------------------------------------------------
alter table restaurants
  add column if not exists listing_status text not null default 'draft' check (listing_status in ('draft','pending_review','approved','rejected','suspended')),
  add column if not exists owner_id uuid references profiles(id),
  add column if not exists rejection_reason text,
  add column if not exists admin_notes text,
  add column if not exists submitted_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists location_id uuid references locations(id);

-- Only show approved listings publicly
drop policy if exists "public read restaurants" on restaurants;
create policy "public read approved restaurants" on restaurants for select
  using (listing_status = 'approved' or auth.uid() = owner_id or
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Owners can manage their own listings
create policy "owners manage own listings" on restaurants for all
  using (auth.uid() = owner_id);

-- Admins can manage all listings
create policy "admins manage all listings" on restaurants for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ---------------------------------------------------------------------------
-- LISTING IMAGES — Supabase Storage references
-- ---------------------------------------------------------------------------
create table listing_images (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  storage_path text not null,             -- path in Supabase Storage bucket
  url text,                               -- signed or public URL (cached)
  alt_text text,
  is_primary boolean default false,
  sort_order int default 0,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
alter table listing_images enable row level security;
create policy "public read listing images" on listing_images for select using (true);
create policy "owners manage own images" on listing_images for all
  using (exists (
    select 1 from restaurants r where r.id = restaurant_id and r.owner_id = auth.uid()
  ));

create index idx_listing_images_restaurant on listing_images(restaurant_id);

-- ---------------------------------------------------------------------------
-- SAVED LISTINGS — user bookmarks
-- ---------------------------------------------------------------------------
create table saved_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, restaurant_id)
);
alter table saved_listings enable row level security;
create policy "users manage own saved" on saved_listings for all using (auth.uid() = user_id);

create index idx_saved_listings_user on saved_listings(user_id);

-- ---------------------------------------------------------------------------
-- LISTING CLAIMS — allow users to claim an existing unclaimed listing
-- ---------------------------------------------------------------------------
create table listing_claims (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  claimant_id uuid not null references profiles(id),
  status text not null default 'pending', -- pending | approved | rejected
  evidence_notes text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table listing_claims enable row level security;
create policy "users view own claims" on listing_claims for select using (auth.uid() = claimant_id);
create policy "users insert claims"   on listing_claims for insert with check (auth.uid() = claimant_id);
create policy "admins manage claims"  on listing_claims for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ---------------------------------------------------------------------------
-- ENQUIRIES — contact/enquiry forms on listing detail pages
-- ---------------------------------------------------------------------------
create table enquiries (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  sender_name text not null,
  sender_email text not null,
  sender_phone text,
  message text not null,
  status text not null default 'new',     -- new | read | replied | spam
  replied_at timestamptz,
  created_at timestamptz not null default now()
);
alter table enquiries enable row level security;
create policy "anyone can submit enquiry" on enquiries for insert with check (true);
create policy "owners read own enquiries" on enquiries for select using (
  exists (select 1 from restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
);
create policy "admins read all enquiries" on enquiries for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

create index idx_enquiries_restaurant on enquiries(restaurant_id);

-- ---------------------------------------------------------------------------
-- REVIEW REPORTS — flag a review for moderation
-- ---------------------------------------------------------------------------
create table review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  reporter_id uuid references profiles(id),
  reason text not null,
  status text not null default 'pending', -- pending | actioned | dismissed
  reviewed_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
alter table review_reports enable row level security;
create policy "anyone can report review" on review_reports for insert with check (true);
create policy "admins manage reports"    on review_reports for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ---------------------------------------------------------------------------
-- ONBOARDING PROGRESS — track each step for new restaurant owners
-- ---------------------------------------------------------------------------
create table onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade unique,
  step_profile_complete boolean default false,
  step_listing_created boolean default false,
  step_images_uploaded boolean default false,
  step_listing_submitted boolean default false,
  step_approved boolean default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table onboarding_progress enable row level security;
create policy "users manage own onboarding" on onboarding_progress for all
  using (auth.uid() = user_id);

create trigger trg_onboarding_updated_at
before update on onboarding_progress
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- AUDIT LOGS — admin + security-sensitive action history
-- ---------------------------------------------------------------------------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,                   -- "listing.approved", "user.role_changed" etc
  target_table text,
  target_id uuid,
  metadata jsonb default '{}',
  ip_address inet,
  created_at timestamptz not null default now()
);
alter table audit_logs enable row level security;
create policy "admins read audit logs" on audit_logs for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "system insert audit logs" on audit_logs for insert with check (true);

create index idx_audit_logs_actor  on audit_logs(actor_id);
create index idx_audit_logs_action on audit_logs(action);
create index idx_audit_logs_time   on audit_logs(created_at desc);

-- ---------------------------------------------------------------------------
-- SEED CATEGORIES / LOCATIONS — intentionally NOT done here.
-- The full, correct seed (with stable explicit ids) lives in seed.sql,
-- which also creates the `zones` rows that `locations.zone_id` needs.
-- Seeding categories/locations in this file (before zones exist, and with
-- auto-generated ids that later collide with seed.sql's unique slugs) breaks
-- the documented migration order — see supabase/seed.sql instead.
-- ---------------------------------------------------------------------------
