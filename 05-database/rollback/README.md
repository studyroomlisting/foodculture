# Rollback Guide

Supabase does not support automatic transactional rollback of DDL statements.

## How to roll back schema.sql

Only do this on a fresh project with no real data.

```sql
-- Drop all tables (destructive)
DROP TABLE IF EXISTS notifications, activity_feed, connection_requests,
  reviews, deals, influencer_restaurant_posts, influencer_pricing_tiers,
  influencers, restaurant_dishes, dishes, restaurants, zones CASCADE;
```

## How to roll back migration_002.sql

```sql
-- Remove new columns from restaurants
ALTER TABLE restaurants
  DROP COLUMN IF EXISTS listing_status,
  DROP COLUMN IF EXISTS owner_id,
  DROP COLUMN IF EXISTS rejection_reason,
  DROP COLUMN IF EXISTS admin_notes,
  DROP COLUMN IF EXISTS submitted_at,
  DROP COLUMN IF EXISTS approved_at,
  DROP COLUMN IF EXISTS location_id;

-- Drop new tables
DROP TABLE IF EXISTS audit_logs, onboarding_progress, review_reports,
  enquiries, listing_claims, saved_listings, listing_images,
  locations, restaurant_categories, categories, user_roles, profiles CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
```

## How to clear seed data

```sql
DELETE FROM activity_feed;
DELETE FROM influencer_restaurant_posts;
DELETE FROM influencer_pricing_tiers;
DELETE FROM reviews;
DELETE FROM deals;
DELETE FROM restaurant_dishes;
DELETE FROM connection_requests;
DELETE FROM notifications;
DELETE FROM influencers;
DELETE FROM dishes;
DELETE FROM restaurants;
DELETE FROM zones;
DELETE FROM categories;
DELETE FROM locations;
```
