-- ============================================================================
-- MIGRATION 014 — Fix Google-OAuth role assignment being silently blocked by
-- RLS, and close the gap that let ANY authenticated user (any role) create a
-- restaurant listing or an influencer listing regardless of their own role.
--
-- Bug 1 — profiles.role never actually gets set after Google OAuth signup:
-- "users update own profile"'s WITH CHECK required the new row's `role` to
-- stay byte-for-byte equal to whatever's already stored for that user —
-- which includes the ONE UPDATE app/auth/callback/route.ts itself issues
-- right after a brand-new Google signup, to apply the role the user picked
-- on the signup screen. Email/password signups never hit this at all —
-- handle_new_user() sets role correctly at INSERT time from the signup
-- metadata — but every Google OAuth signup got permanently stuck on the
-- 'visitor' default, because that follow-up UPDATE was silently rejected by
-- RLS every time (the app wraps it in try/catch, so it never surfaced as a
-- visible error). That's what showed up as "Visitor" in the nav dropdown for
-- both a restaurant-owner AND an influencer test account.
--
-- Fix: drop the fragile self-referencing-subquery WITH CHECK (the same class
-- of bug already fixed twice in this project — migration_011/012) and
-- replace it with a BEFORE UPDATE trigger, matching the pattern already used
-- for restaurants/influencers status columns: admins can change anyone's
-- role; everyone else gets exactly one self-service transition (visitor ->
-- owner, or visitor -> influencer — i.e. completing signup); any other
-- attempted role change is silently reverted rather than rejecting the
-- whole UPDATE outright.
--
-- Bug 2 — any role could create a restaurant OR an influencer listing:
-- "owners insert own listings" only ever checked `auth.uid() = owner_id` —
-- never that the inserting user's profiles.role was actually 'owner'. Same
-- gap on "creators insert own listing" for influencers. In practice a
-- signed-in influencer (or even a plain visitor) could INSERT their own
-- restaurant row — this is what surfaced as an influencer seeing "+ Add
-- listing" and it would have actually worked if clicked. Fix: require the
-- matching role on both.
--
-- Run AFTER migration_013_influencer_registration.sql.
-- ============================================================================

-- ─── Bug 1: profile role assignment ────────────────────────────────────────
drop policy if exists "users update own profile" on profiles;
create policy "users update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function protect_profile_role_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service-role/trigger context, or an admin acting through the admin
  -- panel: no restriction.
  if auth.uid() is null or is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    if old.role = 'visitor' and new.role in ('owner','influencer') then
      -- The one legitimate self-service transition: completing signup.
      -- Email/password signups already get this right at INSERT time via
      -- handle_new_user(); this is what the Google OAuth path needs, since
      -- it can only apply the chosen role via a follow-up UPDATE.
      new.onboarding_role := new.role;
    else
      -- Block anything else silently (self-escalation to 'admin', trying to
      -- switch an already-assigned owner/influencer role, etc.) instead of
      -- failing the whole UPDATE — a client saving unrelated profile fields
      -- (name, avatar, phone) alongside a stale `role` value should not get
      -- an RLS error for it.
      new.role := old.role;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profile_role on profiles;
create trigger trg_protect_profile_role
  before update on profiles
  for each row execute function protect_profile_role_column();

-- ─── Bug 2: restaurants / influencers insert must match the actor's role ──
drop policy if exists "owners insert own listings" on restaurants;
create policy "owners insert own listings"
  on restaurants for insert
  with check (
    auth.uid() = owner_id
    -- Owners can only INSERT into draft or pending_review — never
    -- approved/suspended/archived (migration_003 PENTEST FIX C-3a).
    and listing_status in ('draft', 'pending_review')
    -- NEW: the inserting account must actually be a restaurant owner.
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
  );

drop policy if exists "creators insert own listing" on influencers;
create policy "creators insert own listing" on influencers for insert
  with check (
    profile_id = auth.uid()
    -- NEW: the inserting account must actually be a food creator.
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'influencer')
  );
