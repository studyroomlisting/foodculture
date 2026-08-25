# RUN_ORDER.md — FoodCulture AI Migration Run Order

Run SQL files in Supabase SQL Editor in this **exact order**.
**Never skip a step.** Each file depends on the previous one.

---

## Complete run order

| Order | File | Purpose | Production Safe |
|---|---|---|---|
| 1 | `supabase/schema.sql` | Core 12 tables, indexes, triggers | Yes (blank DB only) |
| 2 | `supabase/migration_002.sql` | Auth, profiles, images, claims, enquiries, audit_logs | Yes |
| 3 | `supabase/migration_003_security.sql` | RLS policies on all tables | Yes |
| 4 | `supabase/migration_004_onboarding.sql` | Onboarding preference columns | Yes |
| 5 | `supabase/migration_005_search.sql` | pg_trgm, GIN, FTS indexes for <500ms search | Yes |
| 6 | `supabase/migration_006_auth_complete.sql` | M1 full spec: T&C, lockout, influencer role, audit | Yes |
| 7 | `supabase/migration_007_profiles.sql` | M2/M3/M16: extended profile, saved_searches, recently_viewed, admin columns | Yes |
| 8 | `supabase/seed.sql` | Bengaluru test data | **Dev/staging only** |

---

## Step 1 — `supabase/schema.sql`
Creates all 12 core tables, RLS policies, indexes, and the `set_updated_at()` trigger.

**Tables**: zones, restaurants, dishes, restaurant_dishes, influencers, influencer_pricing_tiers, influencer_restaurant_posts, deals, reviews, connection_requests, activity_feed, notifications

---

## Step 2 — `supabase/migration_002.sql`
Adds profiles, auth trigger, audit_logs, onboarding_progress, listing management.

**Tables added**: profiles, user_roles, categories, restaurant_categories, locations, listing_images, saved_listings, listing_claims, enquiries, review_reports, onboarding_progress, audit_logs

---

## Step 3 — `supabase/migration_003_security.sql`
Enables Row Level Security on every table. **Required before any data operations.**
- All users can read approved listings
- Users can only write their own data
- Admin role can read/write everything
- RLS prevents role self-elevation

---

## Step 4 — `supabase/migration_004_onboarding.sql`
Adds onboarding preference columns to profiles and onboarding_progress.

**Columns added to profiles**: preferred_cuisines[], preferred_zone_ids[], notification_prefs jsonb, onboarding_role, bio, instagram_handle

---

## Step 5 — `supabase/migration_005_search.sql`
Installs pg_trgm extension and creates 7 search indexes for <500ms performance.

- `idx_restaurants_name_trgm` — GIN trigram on name
- `idx_restaurants_area_trgm` — GIN trigram on area_label
- `idx_restaurants_cuisine_tags` — GIN on cuisine_tags[]
- `idx_restaurants_approved_score` — Composite (listing_status, intelligence_score DESC)
- `idx_restaurants_rating` — rating DESC
- `idx_restaurants_price_tier` — price_tier
- `idx_restaurants_search_vector` — GIN on FTS tsvector

---

## Step 6 — `supabase/migration_006_auth_complete.sql`
Full M1 authentication spec.

**Columns added to profiles**: terms_accepted_at, privacy_accepted_at, terms_version, remember_me, failed_login_count, last_failed_login_at, locked_at, locked_reason

**Functions**: record_login_success(), is_account_locked()

**Trigger**: handle_new_user() — reads role/T&C from user_metadata, logs auth.register to audit_logs

---

## Step 7 — `supabase/migration_007_profiles.sql`
Full M2/M3/M16 extended profiles.

**Columns added to profiles**: username (unique), date_of_birth, gender, preferred_language, state, country, dietary_preferences[], preferred_search_radius, favourite_restaurant_ids[], influencer content columns, suspended_at, suspended_reason, suspended_by, is_deleted, deleted_at, admin_notes, deactivated_at, profile_public, show_email, show_phone, allow_dm

**New tables**: saved_searches, recently_viewed

---

## Step 8 — `supabase/seed.sql` (Dev/staging only)
Populates with Bengaluru test data: 5 zones, 16 restaurants, 8 influencers, 8 dishes, 4 deals, 8 reviews.

---

## Verification query (run after all migrations)
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
-- Expected: 25+ tables

SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
-- Expected: 35+ columns
```

---

## Rollback guidance
Supabase does not auto-rollback. To undo, reverse the ALTER TABLE statements in each migration file.
**Never run rollback on production without explicit approval.**
