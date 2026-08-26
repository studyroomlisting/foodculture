-- ============================================================================
-- MIGRATION 016 — Let a rejected (or draft) creator listing be resubmitted
-- for review, same as restaurants already can.
--
-- Root cause: protect_influencer_status_columns() (migration_013) freezes
-- listing_status on every UPDATE unconditionally — unlike
-- protect_restaurant_status_columns() (migration_011), which has one
-- specific carve-out letting the owner move draft/rejected -> pending_review
-- themselves (the restaurant dashboard's "Submit for review" button). There
-- was no influencer-side equivalent, so a rejected creator profile was
-- permanently stuck — editing and re-saving it (e.g. from the Account page's
-- new Creator profile section) could never put it back in the review queue;
-- only an admin manually flipping the status in SQL could.
--
-- Fix: same carve-out, mirrored onto influencers.
--
-- Run AFTER migration_015_influencer_connection_requests.sql.
-- ============================================================================

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
    -- Same carve-out as restaurants (migration_011): the creator may move
    -- their OWN draft/rejected listing to pending_review — e.g. by editing
    -- and re-saving their Creator profile after a rejection — but cannot
    -- set any other status themselves, and cannot touch ownership.
    if new.listing_status is distinct from old.listing_status then
      if not (old.listing_status in ('draft','rejected') and new.listing_status = 'pending_review') then
        new.listing_status := old.listing_status;
      end if;
    end if;
    new.approved_at      := old.approved_at;
    new.rejection_reason := old.rejection_reason;
    new.profile_id        := old.profile_id;
  end if;
  return new;
end;
$$;
