-- ============================================================================
-- FoodCulture AI — Supabase schema
-- Covers every entity referenced across all 9 mockups:
-- restaurants, dishes, influencers, deals, reviews, influencer posts,
-- connection requests, zones, notifications.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- ZONES (neighbourhoods) — used on homepage "Trending zones" + dashboards
-- ---------------------------------------------------------------------------
create table zones (
  id uuid primary key default uuid_generate_v4(),
  name text not null,                     -- "Koramangala"
  slug text not null unique,              -- "koramangala" — lib/queries.ts and seed.sql both need this
  trend_score int not null default 0,     -- 0-100, shown as "98"
  restaurant_count int default 0,         -- lib/queries.ts and seed.sql both need this
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RESTAURANTS — directory, detail page, dashboard
-- ---------------------------------------------------------------------------
create table restaurants (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,              -- for /restaurants/[id] friendly URLs
  name text not null,
  emoji text default '🍽️',                -- placeholder visual until real photos
  zone_id uuid references zones(id),
  area_label text,                        -- "Koramangala 5th Block"
  cuisine_tags text[] default '{}',       -- ["North Indian","Biryani","Mughlai"]
  price_tier text,                        -- "₹₹"
  avg_spend int,                          -- 350
  rating numeric(2,1) default 0,          -- 4.8
  total_reviews int default 0,
  intelligence_score int default 0,       -- 0-100, "94"
  intelligence_score_trend int default 0, -- "+12 this week"
  status text default 'active',           -- active | viral | rising | new
  open_until text,                        -- "11:30 PM"
  peak_hours text,                        -- "7-10 PM"
  ai_brief text,                          -- AI Intelligence Brief paragraph
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_restaurants_zone on restaurants(zone_id);
create index idx_restaurants_status on restaurants(status);

-- ---------------------------------------------------------------------------
-- DISHES — trending dishes grid on homepage/trending page
-- ---------------------------------------------------------------------------
create table dishes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,                     -- "Dum Biryani"
  emoji text default '🍛',
  trend_label text,                       -- "+340% searches" / "New craze"
  restaurant_count int default 0,         -- "48 restaurants"
  created_at timestamptz not null default now()
);

-- Many-to-many: which restaurants serve which trending dish (for "Add this item" insights)
create table restaurant_dishes (
  restaurant_id uuid references restaurants(id) on delete cascade,
  dish_id uuid references dishes(id) on delete cascade,
  primary key (restaurant_id, dish_id)
);

-- ---------------------------------------------------------------------------
-- INFLUENCERS — directory, profile v1/v2
-- ---------------------------------------------------------------------------
create table influencers (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  handle text not null,                   -- "@rahulkitchens"
  avatar_initials text,                   -- "RK"
  bio text,
  platform text default 'instagram',      -- instagram | youtube | both
  followers_count int default 0,
  impact_score int default 0,             -- 0-100, "94%"
  engagement_rate numeric(4,1) default 0, -- 8.2
  trust_score int default 0,              -- audience authenticity, "98%"
  fake_follower_pct numeric(4,1) default 0,
  visits_driven_weekly int default 0,
  avg_views int default 0,
  response_time_label text,               -- "Usually within 24h"
  active_cities text[] default '{}',
  cuisine_tags text[] default '{}',
  connection_fee int default 0,           -- ₹1,500
  rank_this_week int,
  created_at timestamptz not null default now()
);

create index idx_influencers_rank on influencers(rank_this_week);

-- Collaboration pricing tiers (influencer profile v2 "Collaboration pricing")
create table influencer_pricing_tiers (
  id uuid primary key default uuid_generate_v4(),
  influencer_id uuid references influencers(id) on delete cascade,
  tier_name text not null,                -- "Reel review"
  description text,
  price int not null,
  deliverables text[] default '{}',       -- lib/queries.ts + seed.sql both need this
  estimated_reach text,                   -- "120K-180K" — lib/queries.ts + seed.sql both need this
  turnaround_days int,                    -- lib/queries.ts + seed.sql both need this
  is_popular boolean default false
);

-- Influencer ↔ restaurant collaboration history (for "Restaurants reviewed recently",
-- "Audience overlap", performance predictor)
create table influencer_restaurant_posts (
  id uuid primary key default uuid_generate_v4(),
  influencer_id uuid references influencers(id) on delete cascade,
  restaurant_id uuid references restaurants(id) on delete cascade,
  caption text,
  views int default 0,
  likes int default 0,
  comments int default 0,
  visits_driven int default 0,
  posted_at timestamptz not null default now()
);

create index idx_inf_posts_influencer on influencer_restaurant_posts(influencer_id);
create index idx_inf_posts_restaurant on influencer_restaurant_posts(restaurant_id);

-- ---------------------------------------------------------------------------
-- DEALS — exclusive FoodCulture deals (modal content, deals page)
-- ---------------------------------------------------------------------------
create table deals (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  code text not null,                     -- "FC-DBH-20"
  title text not null,                    -- "20% off your table tonight"
  description text,
  savings_label text,                     -- "Save up to ₹280"
  color_theme text default 'orange',      -- orange | green | purple (matches mockup palette)
  expires_at timestamptz,
  active boolean default true,
  created_at timestamptz not null default now()
);

create index idx_deals_restaurant on deals(restaurant_id);
create index idx_deals_active on deals(active);

-- ---------------------------------------------------------------------------
-- REVIEWS — restaurant detail page review list
-- ---------------------------------------------------------------------------
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  reviewer_name text not null,
  rating int not null check (rating between 1 and 5),
  body text not null,
  verified_visit boolean default true,
  created_at timestamptz not null default now()
);

create index idx_reviews_restaurant on reviews(restaurant_id);

-- ---------------------------------------------------------------------------
-- CONNECTION REQUESTS — "Connect with [influencer]" modal submissions
-- ---------------------------------------------------------------------------
create table connection_requests (
  id uuid primary key default uuid_generate_v4(),
  influencer_id uuid references influencers(id),
  restaurant_name text not null,
  requester_name text not null,
  collab_interest text,                   -- free text from modal form
  status text default 'pending',          -- pending | accepted | declined
  fee_charged int,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ACTIVITY FEED — homepage "Live activity feed"
-- ---------------------------------------------------------------------------
create table activity_feed (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid references restaurants(id),
  influencer_id uuid references influencers(id),
  message text not null,                  -- "<b>X</b> just went viral..."
  dot_color text default '#E85D26',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS — user notification centre
-- ---------------------------------------------------------------------------
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,                           -- references auth.users(id) once auth is added
  title text not null,
  body text,
  icon text default '🔔',
  read boolean default false,
  link_page text,                         -- which in-app "page" to route to on click
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications(user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger for restaurants
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_restaurants_updated_at
before update on restaurants
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — public read, no public write (writes go through
-- server-side/service-role code only, e.g. connection_requests, notifications)
-- ---------------------------------------------------------------------------
alter table zones enable row level security;
alter table restaurants enable row level security;
alter table dishes enable row level security;
alter table restaurant_dishes enable row level security;
alter table influencers enable row level security;
alter table influencer_pricing_tiers enable row level security;
alter table influencer_restaurant_posts enable row level security;
alter table deals enable row level security;
alter table reviews enable row level security;
alter table activity_feed enable row level security;
alter table connection_requests enable row level security;
alter table notifications enable row level security;

create policy "public read zones" on zones for select using (true);
create policy "public read restaurants" on restaurants for select using (true);
create policy "public read dishes" on dishes for select using (true);
create policy "public read restaurant_dishes" on restaurant_dishes for select using (true);
create policy "public read influencers" on influencers for select using (true);
create policy "public read pricing tiers" on influencer_pricing_tiers for select using (true);
create policy "public read inf posts" on influencer_restaurant_posts for select using (true);
create policy "public read deals" on deals for select using (true);
create policy "public read reviews" on reviews for select using (true);
create policy "public read activity" on activity_feed for select using (true);

-- connection_requests: anyone can insert (the public "Connect" modal), nobody can read others' requests
create policy "public insert connection requests" on connection_requests for insert with check (true);

-- notifications: locked down until auth is wired (service role only for now)
