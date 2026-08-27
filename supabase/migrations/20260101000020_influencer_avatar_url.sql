-- ============================================================================
-- MIGRATION 020 — Show an influencer's uploaded profile photo (not just
-- their initials) on the public /influencers directory and influencer
-- detail pages.
--
-- Root cause: the public `influencers` table never had an image column —
-- only `avatar_initials` (a 2-letter fallback computed once at signup).
-- The actual uploaded photo lives on `profiles.avatar_url` (set via
-- /api/profile/avatar or Google OAuth), but `profiles` RLS only lets a
-- user read their OWN row ("users read own profile" — migration_002), so
-- the public directory can never join to it directly — every visitor
-- would see nothing for anyone else's row.
--
-- Fix: denormalize `avatar_url` onto `influencers` itself (same pattern
-- already used for avatar_initials), kept in sync automatically so no
-- application code has to remember to write it:
--  1. On insert/update of an influencer row (creator registration or
--     resubmission), pull the current avatar_url from the linked profile.
--  2. On update of profiles.avatar_url (e.g. a later photo re-upload via
--     /account), push it onto that user's influencer row, if they have one.
-- No RLS changes needed — `influencers` already has a public-read-when-
-- approved policy (migration_013), so the denormalized column is safe to
-- expose the same way avatar_initials already is.
--
-- Run AFTER migration_019_full_table_search.sql.
-- ============================================================================

alter table influencers
  add column if not exists avatar_url text;

-- One-time backfill for influencers that already exist and are linked to
-- a profile with a photo, so already-approved creators don't have to
-- re-save anything for their photo to appear.
update influencers i
set avatar_url = p.avatar_url
from profiles p
where p.id = i.profile_id
  and p.avatar_url is not null;

-- ─── Keep influencers.avatar_url populated at insert/update time ─────────
create or replace function sync_influencer_avatar_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.profile_id is not null then
    select avatar_url into new.avatar_url from profiles where id = new.profile_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_influencer_avatar on influencers;
create trigger trg_sync_influencer_avatar
  before insert or update on influencers
  for each row execute function sync_influencer_avatar_from_profile();

-- ─── Push later profile photo changes onto the linked influencer row ─────
create or replace function push_avatar_to_influencer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.avatar_url is distinct from old.avatar_url then
    update influencers set avatar_url = new.avatar_url where profile_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_push_avatar_to_influencer on profiles;
create trigger trg_push_avatar_to_influencer
  after update on profiles
  for each row execute function push_avatar_to_influencer();
