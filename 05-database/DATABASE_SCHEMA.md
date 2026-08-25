# DATABASE_SCHEMA.md — FoodCulture AI

Full reference for every table, column, type, constraint, index, and RLS policy.
Database: **Supabase PostgreSQL**

> Note: This project uses Supabase PostgreSQL. The document requirement referenced MySQL — all SQL here is PostgreSQL-compatible.

---

## Table of Contents

1. zones
2. restaurants
3. dishes
4. restaurant_dishes
5. influencers
6. influencer_pricing_tiers
7. influencer_restaurant_posts
8. deals
9. reviews
10. connection_requests
11. activity_feed
12. notifications
13. profiles
14. user_roles
15. categories
16. restaurant_categories
17. locations
18. listing_images
19. saved_listings
20. listing_claims
21. enquiries
22. review_reports
23. onboarding_progress
24. audit_logs

---

## 1. zones

Bengaluru food neighbourhoods. Every restaurant belongs to a zone.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| name | text | NO | — | Zone name e.g. "Koramangala" |
| slug | text | NO | — | URL slug e.g. "koramangala" |
| trend_score | integer | YES | 0 | 0–100 composite trend score |
| restaurant_count | integer | YES | 0 | Cached count |
| created_at | timestamptz | NO | now() | Creation timestamp |

**Indexes**: `slug` (unique)
**RLS**: Public read

---

## 2. restaurants

Core listing table. Every restaurant on the platform.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| slug | text | NO | — | SEO-friendly URL slug (unique) |
| name | text | NO | — | Restaurant display name |
| emoji | text | YES | '🍽️' | Visual identifier emoji |
| zone_id | uuid | YES | — | FK → zones.id |
| location_id | uuid | YES | — | FK → locations.id |
| owner_id | uuid | YES | — | FK → profiles.id |
| area_label | text | YES | — | Human-readable area e.g. "Koramangala 5th Block" |
| cuisine_tags | text[] | NO | '{}' | Array of cuisine strings |
| price_tier | text | YES | — | ₹ \| ₹₹ \| ₹₹₹ \| ₹₹₹₹ |
| avg_spend | integer | YES | — | Average spend per person in ₹ |
| rating | numeric(2,1) | NO | 0 | 0.0–5.0 aggregate rating |
| total_reviews | integer | NO | 0 | Cached review count |
| status | text | NO | 'active' | viral \| rising \| new \| active |
| listing_status | text | NO | 'approved' | draft \| pending_review \| approved \| rejected \| suspended \| archived |
| intelligence_score | integer | NO | 0 | 0–100 AI composite score |
| intelligence_score_trend | integer | NO | 0 | Weekly score delta |
| open_until | text | YES | — | e.g. "11:30 PM" |
| peak_hours | text | YES | — | e.g. "7–10 PM" |
| ai_brief | text | YES | — | AI-generated intelligence summary |
| rejection_reason | text | YES | — | Admin reason for rejection |
| admin_notes | text | YES | — | Internal admin notes |
| submitted_at | timestamptz | YES | — | When submitted for review |
| approved_at | timestamptz | YES | — | When admin approved |
| created_at | timestamptz | NO | now() | Row creation time |
| updated_at | timestamptz | NO | now() | Auto-updated by trigger |

**Indexes**: `slug` (unique), `zone_id`, `listing_status`, `intelligence_score` (desc), `owner_id`
**RLS**: Public read (approved only), owner manages own, admin manages all
**Trigger**: `set_updated_at()` on UPDATE

---

## 3. dishes

Trending dishes tracked across Bengaluru.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| name | text | NO | — | Dish name e.g. "Dum Biryani" |
| emoji | text | YES | '🍽️' | Visual identifier |
| trend_label | text | YES | — | e.g. "🔥 Viral this week" |
| restaurant_count | integer | NO | 0 | How many restaurants serve it |
| created_at | timestamptz | NO | now() | — |

**RLS**: Public read

---

## 4. restaurant_dishes

Many-to-many pivot between restaurants and dishes.

| Column | Type | Nullable | Description |
|---|---|---|---|
| restaurant_id | uuid | NO | FK → restaurants.id (CASCADE DELETE) |
| dish_id | uuid | NO | FK → dishes.id (CASCADE DELETE) |

**Primary key**: (restaurant_id, dish_id)
**RLS**: Public read

---

## 5. influencers

Food creators tracked on the platform.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| slug | text | NO | — | URL slug (unique) |
| name | text | NO | — | Display name |
| handle | text | NO | — | Social handle e.g. "@rahulkitchens" |
| platform | text | NO | — | instagram \| youtube \| both |
| avatar_initials | text | YES | — | 2-char fallback e.g. "RK" |
| followers_count | integer | NO | 0 | Total followers |
| cuisine_tags | text[] | NO | '{}' | Food niches |
| bio | text | YES | — | Short bio |
| impact_score | integer | NO | 0 | 0–100 visit conversion rate |
| trust_score | integer | NO | 0 | 0–100 audience trust rating |
| engagement_rate | numeric(4,2) | YES | — | % engagement |
| visits_driven_weekly | integer | NO | 0 | Weekly restaurant visits attributed |
| connection_fee | integer | NO | 0 | One-time intro fee in ₹ |
| rank | integer | YES | — | Leaderboard rank |
| created_at | timestamptz | NO | now() | — |

**Indexes**: `slug` (unique), `rank`, `impact_score` (desc)
**RLS**: Public read

---

## 6. influencer_pricing_tiers

Package pricing per influencer.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| influencer_id | uuid | NO | — | FK → influencers.id |
| tier_name | text | NO | — | e.g. "Story + Reel" |
| price | integer | NO | — | Price in ₹ |
| deliverables | text[] | NO | '{}' | List of deliverables |
| estimated_reach | text | YES | — | e.g. "45K–60K" |
| turnaround_days | integer | YES | — | Delivery time |
| created_at | timestamptz | NO | now() | — |

**RLS**: Public read

---

## 7. influencer_restaurant_posts

Content that influencers have posted about restaurants.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| influencer_id | uuid | NO | — | FK → influencers.id |
| restaurant_id | uuid | NO | — | FK → restaurants.id |
| platform | text | YES | — | instagram \| youtube \| both |
| caption | text | YES | — | Post caption/excerpt |
| views | integer | NO | 0 | View count |
| likes | integer | NO | 0 | Like count |
| comments | integer | NO | 0 | Comment count |
| visits_driven | integer | NO | 0 | Attributed restaurant visits |
| posted_at | timestamptz | YES | — | When posted |
| created_at | timestamptz | NO | now() | — |

**Indexes**: `influencer_id`, `restaurant_id`
**RLS**: Public read

---

## 8. deals

Exclusive restaurant deals available through FoodCulture AI.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| restaurant_id | uuid | NO | — | FK → restaurants.id |
| title | text | NO | — | Deal headline |
| description | text | YES | — | Full deal description |
| code | text | NO | — | Promo code e.g. "FC-DBH-20" |
| savings_label | text | YES | — | e.g. "Save ₹200" |
| color_theme | text | NO | 'orange' | orange \| green \| purple |
| expires_at | timestamptz | YES | — | Expiry (null = no expiry) |
| active | boolean | NO | true | Whether deal is live |
| created_at | timestamptz | NO | now() | — |

**Indexes**: `restaurant_id`, `active`, `expires_at`
**RLS**: Public read

---

## 9. reviews

Customer reviews for restaurants.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| restaurant_id | uuid | NO | — | FK → restaurants.id |
| reviewer_name | text | NO | — | Display name (anonymous allowed) |
| rating | integer | NO | — | 1–5 star rating |
| body | text | NO | — | Review text |
| verified_visit | boolean | NO | false | Whether visit was verified |
| created_at | timestamptz | NO | now() | — |

**Indexes**: `restaurant_id`, `rating`
**RLS**: Public read, public INSERT, admin DELETE

---

## 10. connection_requests

Restaurants requesting to connect with influencers.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| influencer_id | uuid | NO | — | FK → influencers.id |
| restaurant_name | text | NO | — | Requesting restaurant name |
| requester_name | text | NO | — | Contact person name |
| collab_interest | text | YES | — | What type of collab |
| status | text | NO | 'pending' | pending \| accepted \| rejected \| completed |
| created_at | timestamptz | NO | now() | — |

**RLS**: Public INSERT, influencer/admin read

---

## 11. activity_feed

Live activity stream shown on homepage.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| message | text | NO | — | HTML-safe message string |
| dot_color | text | NO | '#E85D26' | Colour of indicator dot |
| created_at | timestamptz | NO | now() | — |

**RLS**: Public read

---

## 12. notifications

Per-user notification records.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| user_id | uuid | NO | — | FK → profiles.id |
| type | text | NO | — | review \| deal \| claim \| system |
| message | text | NO | — | Notification body |
| read | boolean | NO | false | Whether user has read it |
| created_at | timestamptz | NO | now() | — |

**Indexes**: `user_id`, `read`
**RLS**: User reads own

---

## 13. profiles

User profile linked to Supabase Auth. Auto-created on signup.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | — | PK + FK → auth.users.id |
| full_name | text | YES | — | Display name |
| avatar_url | text | YES | — | Profile photo URL |
| phone | text | YES | — | Phone number |
| city | text | YES | 'Bengaluru' | City |
| role | text | NO | 'visitor' | visitor \| owner \| admin |
| onboarding_complete | boolean | NO | false | Has completed onboarding |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | Auto-updated |

**Trigger**: `handle_new_user()` on auth.users INSERT auto-creates this row
**RLS**: User reads/updates own, admin reads all

---

## 14. user_roles

Explicit role assignments (supports multi-role if needed).

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| user_id | uuid | NO | — | FK → profiles.id |
| role | text | NO | — | visitor \| owner \| admin |
| granted_by | uuid | YES | — | FK → profiles.id (who granted) |
| granted_at | timestamptz | NO | now() | — |

**Unique**: (user_id, role)
**RLS**: Admin only

---

## 15. categories

Cuisine categories for filtering and public category pages.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| name | text | NO | — | e.g. "Biryani" (unique) |
| slug | text | NO | — | e.g. "biryani" (unique) |
| emoji | text | YES | '🍽️' | Category emoji |
| description | text | YES | — | Short description |
| restaurant_count | integer | NO | 0 | Cached count |
| created_at | timestamptz | NO | now() | — |

**RLS**: Public read

---

## 16. restaurant_categories

Many-to-many pivot between restaurants and categories.

| Column | Type | Nullable | Description |
|---|---|---|---|
| restaurant_id | uuid | NO | FK → restaurants.id (CASCADE) |
| category_id | uuid | NO | FK → categories.id (CASCADE) |

**Primary key**: (restaurant_id, category_id)
**RLS**: Public read

---

## 17. locations

Sub-area locations within zones for detailed neighbourhood pages.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| zone_id | uuid | YES | — | FK → zones.id |
| name | text | NO | — | e.g. "Koramangala 5th Block" |
| slug | text | NO | — | URL slug (unique) |
| description | text | YES | — | Short area description |
| restaurant_count | integer | NO | 0 | Cached count |
| created_at | timestamptz | NO | now() | — |

**RLS**: Public read

---

## 18. listing_images

Restaurant photos stored in Supabase Storage.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| restaurant_id | uuid | NO | — | FK → restaurants.id (CASCADE) |
| storage_path | text | NO | — | Path in `listing-images` bucket |
| url | text | YES | — | Public URL (cached) |
| alt_text | text | YES | — | Accessibility alt text |
| is_primary | boolean | NO | false | Cover/hero photo flag |
| sort_order | integer | NO | 0 | Display order |
| uploaded_by | uuid | YES | — | FK → profiles.id |
| created_at | timestamptz | NO | now() | — |

**Indexes**: `restaurant_id`
**RLS**: Public read, owner manages own

---

## 19. saved_listings

User bookmarks / saved restaurants.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| user_id | uuid | NO | — | FK → profiles.id (CASCADE) |
| restaurant_id | uuid | NO | — | FK → restaurants.id (CASCADE) |
| created_at | timestamptz | NO | now() | — |

**Unique**: (user_id, restaurant_id)
**Indexes**: `user_id`
**RLS**: User manages own only

---

## 20. listing_claims

Requests to take ownership of an unclaimed listing.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| restaurant_id | uuid | NO | — | FK → restaurants.id (CASCADE) |
| claimant_id | uuid | NO | — | FK → profiles.id |
| status | text | NO | 'pending' | pending \| approved \| rejected |
| evidence_notes | text | YES | — | How claimant proves ownership |
| reviewed_by | uuid | YES | — | FK → profiles.id (admin who reviewed) |
| reviewed_at | timestamptz | YES | — | When reviewed |
| created_at | timestamptz | NO | now() | — |

**RLS**: User sees own, admin manages all

---

## 21. enquiries

Contact form submissions from restaurant detail pages.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| restaurant_id | uuid | NO | — | FK → restaurants.id (CASCADE) |
| sender_name | text | NO | — | Contact name |
| sender_email | text | NO | — | Contact email |
| sender_phone | text | YES | — | Contact phone (optional) |
| message | text | NO | — | Enquiry message |
| status | text | NO | 'new' | new \| read \| replied \| spam |
| replied_at | timestamptz | YES | — | When restaurant replied |
| created_at | timestamptz | NO | now() | — |

**Indexes**: `restaurant_id`
**RLS**: Public INSERT, owner reads own restaurant's enquiries, admin reads all

---

## 22. review_reports

Flags on reviews for moderation.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| review_id | uuid | NO | — | FK → reviews.id (CASCADE) |
| reporter_id | uuid | YES | — | FK → profiles.id (null if anonymous) |
| reason | text | NO | — | Why the review is being flagged |
| status | text | NO | 'pending' | pending \| actioned \| dismissed |
| reviewed_by | uuid | YES | — | FK → profiles.id (admin) |
| created_at | timestamptz | NO | now() | — |

**RLS**: Public INSERT, admin manages all

---

## 23. onboarding_progress

Tracks which setup steps a restaurant owner has completed.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| user_id | uuid | NO | — | FK → profiles.id (unique) |
| step_profile_complete | boolean | NO | false | Step 1 done |
| step_listing_created | boolean | NO | false | Step 2 done |
| step_images_uploaded | boolean | NO | false | Step 3 done |
| step_listing_submitted | boolean | NO | false | Step 4 done |
| step_approved | boolean | NO | false | Admin approved listing |
| completed_at | timestamptz | YES | — | When all steps done |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | Auto-updated |

**Unique**: user_id (one row per user)
**RLS**: User manages own only

---

## 24. audit_logs

Immutable log of admin and security-sensitive actions.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| actor_id | uuid | YES | — | FK → profiles.id (who did it) |
| action | text | NO | — | e.g. "listing.approved", "review.deleted" |
| target_table | text | YES | — | Which table was affected |
| target_id | uuid | YES | — | Which row was affected |
| metadata | jsonb | YES | '{}' | Extra context (name, reason, etc.) |
| ip_address | inet | YES | — | Requester IP |
| created_at | timestamptz | NO | now() | Immutable — no UPDATE allowed |

**Indexes**: `actor_id`, `action`, `created_at DESC`
**RLS**: Admin read only, system INSERT (no UPDATE, no DELETE)

---

## Shared trigger function

```sql
-- Used by restaurants, profiles, onboarding_progress
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```

---

## Auth trigger

```sql
-- Auto-creates profiles row when user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;
```
