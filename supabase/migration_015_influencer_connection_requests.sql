-- ============================================================================
-- MIGRATION 015 — Let an influencer actually see and respond to the
-- collaboration requests restaurants send them.
--
-- Root cause: connection_requests already had an INSERT policy (any signed-in
-- user can submit one — that's the restaurant-side "Connect" button on an
-- influencer's profile) and a SELECT policy for the REQUESTING restaurant
-- owner, but nothing ever let the influencer being requested read their own
-- rows. InfluencerDashboard.tsx's "Collaboration requests" box was wired as a
-- permanent static placeholder ("No collaboration requests yet") because
-- there was nothing it could query — even an admin bypass alone wouldn't
-- have helped, since the actual influencer never had read access.
--
-- Fix: add a SELECT policy matching the influencer via influencers.profile_id
-- = auth.uid() (connection_requests.influencer_id points at the influencers
-- table, not directly at profiles/auth.uid()), and an UPDATE policy + a
-- protective trigger (same pattern as protect_restaurant_status_columns /
-- protect_influencer_status_columns) so an influencer can Accept/Decline
-- their own pending request — and only that: no other column, no touching
-- someone else's request, no jumping straight to 'accepted' on a request
-- that isn't theirs or isn't pending.
--
-- Run AFTER migration_014_fix_role_assignment_rls.sql.
-- ============================================================================

drop policy if exists "creators view own connection requests" on connection_requests;
create policy "creators view own connection requests"
  on connection_requests for select
  using (
    exists (
      select 1 from influencers i
      where i.id = connection_requests.influencer_id
        and i.profile_id = auth.uid()
    )
  );

drop policy if exists "creators respond to own connection requests" on connection_requests;
create policy "creators respond to own connection requests"
  on connection_requests for update
  using (
    exists (
      select 1 from influencers i
      where i.id = connection_requests.influencer_id
        and i.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from influencers i
      where i.id = connection_requests.influencer_id
        and i.profile_id = auth.uid()
    )
  );

create or replace function protect_connection_request_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admins (the "admins manage connection requests" FOR ALL policy) get no
  -- restriction — they can fix/correct a request however needed.
  if auth.uid() is null or is_admin() then
    return new;
  end if;

  -- Everyone else (the influencer being requested, via the UPDATE policy
  -- above) can only flip status from pending -> accepted/declined — every
  -- other column is frozen back to its old value, and any other status
  -- transition is silently ignored rather than erroring the whole request.
  if old.status = 'pending' and new.status in ('accepted','declined') then
    new.influencer_id   := old.influencer_id;
    new.restaurant_name := old.restaurant_name;
    new.requester_name  := old.requester_name;
    new.collab_interest := old.collab_interest;
    new.fee_charged      := old.fee_charged;
    new.created_at        := old.created_at;
  else
    new.status := old.status;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_connection_request on connection_requests;
create trigger trg_protect_connection_request
  before update on connection_requests
  for each row execute function protect_connection_request_columns();
