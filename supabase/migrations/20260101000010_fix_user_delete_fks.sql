-- ============================================================================
-- MIGRATION 010 — Fix "Unable to delete row... referenced by foreign key
-- constraint" when deleting a user (from Table Editor, SQL, or the
-- Authentication > Users panel).
--
-- Root cause: `profiles.id` is referenced from 8 other tables (who uploaded
-- an image, who claimed a listing, who triggered an audit log entry, etc.)
-- and none of those foreign keys had an ON DELETE behaviour — so Postgres
-- defaults to NO ACTION and blocks the delete the moment the user has done
-- *anything* (even just signing in, which writes an audit_logs row).
-- Deleting a user from Supabase Auth cascades into `profiles` (that FK
-- already has ON DELETE CASCADE), which then hits this same wall.
--
-- Fix: give each of these foreign keys an explicit ON DELETE behaviour —
-- SET NULL for "who did this" attribution columns (history is kept, the
-- actor reference just goes blank), CASCADE only for
-- listing_claims.claimant_id, which is NOT NULL and meaningless without a
-- claimant.
--
-- Run AFTER migration_009_fix_signup_search_path.sql.
-- ============================================================================

alter table audit_logs
  drop constraint if exists audit_logs_actor_id_fkey,
  add constraint audit_logs_actor_id_fkey
    foreign key (actor_id) references profiles(id) on delete set null;

alter table listing_claims
  drop constraint if exists listing_claims_claimant_id_fkey,
  add constraint listing_claims_claimant_id_fkey
    foreign key (claimant_id) references profiles(id) on delete cascade;

alter table listing_claims
  drop constraint if exists listing_claims_reviewed_by_fkey,
  add constraint listing_claims_reviewed_by_fkey
    foreign key (reviewed_by) references profiles(id) on delete set null;

alter table listing_images
  drop constraint if exists listing_images_uploaded_by_fkey,
  add constraint listing_images_uploaded_by_fkey
    foreign key (uploaded_by) references profiles(id) on delete set null;

alter table profiles
  drop constraint if exists profiles_suspended_by_fkey,
  add constraint profiles_suspended_by_fkey
    foreign key (suspended_by) references profiles(id) on delete set null;

alter table restaurants
  drop constraint if exists restaurants_owner_id_fkey,
  add constraint restaurants_owner_id_fkey
    foreign key (owner_id) references profiles(id) on delete set null;

alter table review_reports
  drop constraint if exists review_reports_reporter_id_fkey,
  add constraint review_reports_reporter_id_fkey
    foreign key (reporter_id) references profiles(id) on delete set null;

alter table review_reports
  drop constraint if exists review_reports_reviewed_by_fkey,
  add constraint review_reports_reviewed_by_fkey
    foreign key (reviewed_by) references profiles(id) on delete set null;

alter table user_roles
  drop constraint if exists user_roles_granted_by_fkey,
  add constraint user_roles_granted_by_fkey
    foreign key (granted_by) references profiles(id) on delete set null;
