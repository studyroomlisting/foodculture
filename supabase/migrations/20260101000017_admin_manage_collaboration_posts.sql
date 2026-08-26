-- ============================================================================
-- MIGRATION 017 — Let an admin actually log a completed restaurant ×
-- influencer collaboration (a row in influencer_restaurant_posts).
--
-- Root cause: influencer_restaurant_posts has had RLS enabled since the
-- original schema, but only ever a SELECT policy ("public read inf posts").
-- No INSERT/UPDATE/DELETE policy existed for ANYONE — not even an admin —
-- through the normal (anon-key + user session) client. The restaurant
-- detail page's "Influencer coverage" tab and the influencer dashboard's
-- "Recent posts" both only ever display this table; nothing in the app
-- could write to it, so after a restaurant successfully connects with an
-- influencer (owner sends a request, influencer accepts — both of which
-- already work), there was no way for that real-world collaboration to ever
-- show up anywhere on the site. Only supabase/seed.sql's demo rows (run
-- with the service role, which bypasses RLS) ever populated this table.
--
-- Fix: admin-only write access, same shape as every other "admins manage
-- all X" policy in this project.
--
-- Run AFTER migration_016_influencer_resubmit.sql.
-- ============================================================================

drop policy if exists "admins manage collaboration posts" on influencer_restaurant_posts;
create policy "admins manage collaboration posts"
  on influencer_restaurant_posts for all
  using (is_admin())
  with check (is_admin());
