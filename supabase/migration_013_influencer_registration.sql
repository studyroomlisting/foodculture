-- ============================================================================
-- MIGRATION 013 — Wire real influencer signup into the public `influencers`
-- directory (it never was).
--
-- Root cause: the "Food Creator" signup wizard (InfluencerOnboarding in
-- components/live/OnboardingPage.tsx) only ever wrote to `profiles`
-- (profiles.role = 'influencer'). The public influencer directory
-- (/influencers, restaurant "Find influencers", influencer profile pages,
-- restaurant-to-creator connection requests) all read from a completely
-- separate `influencers` table — one with no column linking it back to a
-- real user account at all, and the only code that ever inserted into it
-- was seed.sql's demo data. A real user could complete the whole wizard,
-- see "Restaurants can now find you", and never actually appear anywhere.
--
-- Fix:
--  1. Link `influencers` to `profiles` via a new unique `profile_id` column.
--  2. Add a moderation lifecycle (listing_status/rejection_reason/
--     approved_at) mirroring restaurants' draft -> pending_review ->
--     approved/rejected, via the same trigger-based-protection pattern
--     (migration_011) so a creator can't self-approve their own listing.
--     Existing (seed/demo) rows default to 'approved' so nothing already
--     visible on the site disappears.
--  3. RLS so a signed-in creator can create/update their OWN influencers
--     row, and the public only sees approved ones (+ owners see their own
--     regardless of status, + admins see everything) — same shape as the
--     restaurants policies.
--
-- Run AFTER migration_012_storage_buckets.sql.
-- ============================================================================

alter table influencers
  add column if not exists profile_id      uuid unique references profiles(id) on delete cascade,
  add column if not exists listing_status  text not null default 'approved'
    check (listing_status in ('pending_review','approved','rejected')),
  add column if not exists rejection_reason text,
  add column if not exists approved_at      timestamptz;

-- Any row inserted from here on (i.e. every real signup, since seed.sql has
-- already run by now) starts as pending_review, not approved.
alter table influencers alter column listing_status set default 'pending_review';

create index if not exists idx_influencers_listing_status on influencers(listing_status);

-- ─── RLS ────────────────────────────────────────────────────────────────────
drop policy if exists "public read influencers" on influencers;
create policy "public read influencers" on influencers for select
  using (
    listing_status = 'approved'
    or profile_id = auth.uid()
    or is_admin()
  );

drop policy if exists "creators insert own listing" on influencers;
create policy "creators insert own listing" on influencers for insert
  with check (profile_id = auth.uid());

drop policy if exists "creators update own listing" on influencers;
create policy "creators update own listing" on influencers for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists "admins manage all influencers" on influencers;
create policy "admins manage all influencers" on influencers for all
  using (is_admin())
  with check (is_admin());

-- ─── Protect the moderation columns the same way restaurants' are ─────────
create or replace function protect_influencer_status_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- A creator can only ever create a listing tied to themselves, and it
    -- always starts pending review — no way to insert pre-approved.
    new.profile_id      := auth.uid();
    new.listing_status  := 'pending_review';
    new.approved_at     := null;
    new.rejection_reason:= null;
  else
    -- On UPDATE (e.g. editing bio/cuisine later), moderation fields and
    -- ownership are frozen — only admins (handled above) can change them.
    new.listing_status  := old.listing_status;
    new.approved_at     := old.approved_at;
    new.rejection_reason:= old.rejection_reason;
    new.profile_id       := old.profile_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_influencer_status on influencers;
create trigger trg_protect_influencer_status
  before insert or update on influencers
  for each row execute function protect_influencer_status_columns();
