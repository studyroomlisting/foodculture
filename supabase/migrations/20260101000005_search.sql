-- ============================================================================
-- MIGRATION 005 — Search & Discovery indexes
-- Run after migration_004_onboarding.sql
-- Enables <500ms search performance on restaurant name, area, cuisine
-- ============================================================================

-- ─── pg_trgm for fast ILIKE / similarity search ────────────────────────────
create extension if not exists pg_trgm;

-- ─── Trigram indexes for fuzzy text search ────────────────────────────────
create index if not exists idx_restaurants_name_trgm
  on restaurants using gin(name gin_trgm_ops);

create index if not exists idx_restaurants_area_trgm
  on restaurants using gin(area_label gin_trgm_ops);

-- ─── GIN index for cuisine_tags array contains queries ────────────────────
create index if not exists idx_restaurants_cuisine_tags
  on restaurants using gin(cuisine_tags);

-- ─── Composite index for the most common query pattern:
--     approved + sorted by intelligence_score ─────────────────────────────
create index if not exists idx_restaurants_approved_score
  on restaurants(listing_status, intelligence_score desc)
  where listing_status = 'approved';

-- ─── Rating index for filter + sort ───────────────────────────────────────
create index if not exists idx_restaurants_rating
  on restaurants(rating desc)
  where listing_status = 'approved';

-- ─── Price tier index ─────────────────────────────────────────────────────
create index if not exists idx_restaurants_price_tier
  on restaurants(price_tier)
  where listing_status = 'approved';

-- ─── status (viral/rising/new) index ─────────────────────────────────────
-- Already exists: idx_restaurants_status — no duplicate needed

-- ─── Full-text search vector (for future AI search expansion) ─────────────
-- array_to_string() is STABLE, not IMMUTABLE, so it can't be used directly
-- inside a generated column expression ("generation expression is not
-- immutable"). Wrap it in a tiny IMMUTABLE shim just for this purpose —
-- cuisine_tags is plain text with no locale-dependent formatting, so
-- pinning it as immutable here is safe.
create or replace function immutable_array_to_string(text[], text)
  returns text as $$ select array_to_string($1, $2) $$
  language sql immutable;

alter table restaurants
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(area_label,'')), 'B') ||
    setweight(to_tsvector('simple', immutable_array_to_string(coalesce(cuisine_tags, '{}'), ' ')), 'C')
  ) stored;

create index if not exists idx_restaurants_search_vector
  on restaurants using gin(search_vector);

-- ─── Verify indexes (run to confirm) ──────────────────────────────────────
-- select indexname, indexdef from pg_indexes
-- where tablename = 'restaurants'
-- order by indexname;
