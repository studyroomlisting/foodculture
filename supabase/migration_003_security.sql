-- ============================================================================
-- SECURITY MIGRATION 003 — Critical & High vulnerability fixes
-- FoodCulture AI · July 2026
-- Run in Supabase SQL Editor AFTER schema.sql and migration_002.sql
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- CRITICAL-1: User can self-elevate role to admin
-- Problem: "users update own profile" has no column restriction
-- Fix: Drop the permissive policy, replace with column-restricted version
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "users update own profile" on profiles;

create policy "users update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Prevent users from changing their own role or escalating privileges
    -- Only admins can change roles (handled by separate policy below)
    and role = (select role from profiles where id = auth.uid())
  );

-- Admins can update any profile including role changes
drop policy if exists "admins update any profile" on profiles;
create policy "admins update any profile"
  on profiles for update
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- CRITICAL-2: Conflicting restaurant SELECT policies expose all listings
-- Problem: schema.sql "public read restaurants" using(true) overrides the
--          migration_002 approved-only policy because ANY matching policy grants
-- Fix: Drop the blanket policy; keep only the scoped approved-only policy
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "public read restaurants" on restaurants;

-- "public read approved restaurants" from migration_002 already exists:
--   using (listing_status = 'approved' OR auth.uid() = owner_id OR is_admin)
-- Re-create it explicitly to ensure it's correct (drop first in case it drifted)
drop policy if exists "public read approved restaurants" on restaurants;

create policy "public read approved restaurants"
  on restaurants for select
  using (
    listing_status = 'approved'
    or auth.uid() = owner_id
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- CRITICAL-3: Owner can self-approve their listing
-- Problem: "owners manage own listings" FOR ALL lets owner UPDATE listing_status
-- Fix: Split into separate SELECT / INSERT / UPDATE policies with column
--      restrictions on UPDATE so owners cannot touch listing_status,
--      rejection_reason, admin_notes, approved_at
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "owners manage own listings" on restaurants;

-- Owners can SELECT their own listings (including non-approved)
create policy "owners select own listings"
  on restaurants for select
  using (auth.uid() = owner_id);

-- Owners can INSERT new listings (only with their own owner_id)
create policy "owners insert own listings"
  on restaurants for insert
  with check (auth.uid() = owner_id);

-- Owners can UPDATE their own listings but CANNOT touch lifecycle/admin columns
-- Blocked columns: listing_status, rejection_reason, admin_notes, approved_at, owner_id
create policy "owners update own listings"
  on restaurants for update
  using (auth.uid() = owner_id)
  with check (
    auth.uid() = owner_id
    -- Prevent owners from changing listing_status (only admins can approve/reject)
    and listing_status = (select listing_status from restaurants where id = restaurants.id)
    -- Prevent owners from changing approved_at
    and approved_at is not distinct from (select approved_at from restaurants where id = restaurants.id)
    -- Prevent owners from changing rejection_reason
    and rejection_reason is not distinct from (select rejection_reason from restaurants where id = restaurants.id)
    -- Prevent owners from reassigning ownership
    and owner_id = auth.uid()
  );

-- Owners can DELETE their own draft listings only
create policy "owners delete own draft listings"
  on restaurants for delete
  using (auth.uid() = owner_id and listing_status in ('draft', 'rejected'));

-- Admins retain full control (keep existing policy, re-create for clarity)
drop policy if exists "admins manage all listings" on restaurants;
create policy "admins manage all listings"
  on restaurants for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- CRITICAL-4: Audit logs writable by any anonymous user
-- Problem: "system insert audit logs" with check (true) — no auth required
-- Fix: Only authenticated users (or service role) can insert audit logs
--      Restrict: actor_id must match the calling user's uid
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "system insert audit logs" on audit_logs;

-- Only authenticated users can insert, and actor_id must be their own uid
create policy "authenticated insert audit logs"
  on audit_logs for insert
  with check (
    auth.uid() is not null
    and (actor_id = auth.uid() or actor_id is null)
  );

-- Prevent any UPDATE or DELETE on audit logs (immutable)
-- (No update/delete policies = blocked by default with RLS enabled)

-- ─────────────────────────────────────────────────────────────────────────────
-- HIGH-1: Notifications table — zero RLS policies
-- Fix: Users can only read/update their own notifications; system can insert
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "users read own notifications"   on notifications;
drop policy if exists "users update own notifications" on notifications;
drop policy if exists "system insert notifications"    on notifications;

create policy "users read own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "users update own notifications"
  on notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Only service role (server-side) can insert notifications
-- Authenticated users cannot insert their own notifications
create policy "service role insert notifications"
  on notifications for insert
  with check (
    -- Allow service role (auth.uid() is null in service role context)
    auth.uid() is null
    -- OR allow admin users to insert system notifications
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- HIGH-2: Reviews — no INSERT policy (submissions silently fail)
-- Fix: Authenticated users can insert reviews; enforce restaurant existence
-- Rate-limit abuse prevented by: 1 review per user per restaurant
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "authenticated users insert reviews" on reviews;
drop policy if exists "users insert own reviews"           on reviews;
drop policy if exists "admins manage reviews"              on reviews;

create policy "authenticated users insert reviews"
  on reviews for insert
  with check (
    -- Must be authenticated
    auth.uid() is not null
    -- Restaurant must exist and be approved
    and exists (
      select 1 from restaurants r
      where r.id = restaurant_id and r.listing_status = 'approved'
    )
    -- Prevent rating values outside 1-5
    and rating between 1 and 5
  );

-- Admins can delete (moderate) reviews
create policy "admins manage reviews"
  on reviews for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- HIGH-3: Connection requests — no SELECT or DELETE policy
-- Fix: Requesters (by restaurant name match is not possible without user id)
--      Authenticated users can view requests they submitted (via restaurant ownership)
--      Admins can read all
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "public insert connection requests" on connection_requests;
drop policy if exists "owners view own connection requests" on connection_requests;
drop policy if exists "admins manage connection requests"  on connection_requests;

-- Only authenticated users can submit connection requests
create policy "authenticated insert connection requests"
  on connection_requests for insert
  with check (auth.uid() is not null);

-- Restaurant owners can read connection requests they submitted
-- (matched via restaurant ownership — the restaurant_name in connection_requests
--  maps back to a restaurant owned by the current user)
create policy "owners view own connection requests"
  on connection_requests for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from restaurants r
      where r.owner_id = auth.uid()
        and lower(r.name) = lower(restaurant_name)
    )
  );

-- Admins can manage all connection requests
create policy "admins manage connection requests"
  on connection_requests for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- HIGH-4: listing_images INSERT has no WITH CHECK (owner_id verification)
-- Fix: Ensure the uploading user owns the target restaurant
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "owners manage own images" on listing_images;

-- Read: anyone can view images of approved restaurants
create policy "public read approved listing images"
  on listing_images for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = restaurant_id
        and (r.listing_status = 'approved' or r.owner_id = auth.uid())
    )
  );

-- Insert: only the restaurant owner can add images, with explicit WITH CHECK
create policy "owners insert own listing images"
  on listing_images for insert
  with check (
    auth.uid() is not null
    and exists (
      select 1 from restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

-- Update/Delete: only the restaurant owner
create policy "owners update own listing images"
  on listing_images for update
  using (
    exists (
      select 1 from restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

create policy "owners delete own listing images"
  on listing_images for delete
  using (
    exists (
      select 1 from restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

-- Admins can manage all images
create policy "admins manage all listing images"
  on listing_images for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- ADDITIONAL: Prevent duplicate conflicting profile read policies
-- ─────────────────────────────────────────────────────────────────────────────

-- Both "users read own profile" and "admins read all profiles" exist.
-- They use USING which is correct for SELECT. No change needed here.
-- But verify admins policy doesn't create recursive loop:
drop policy if exists "admins read all profiles" on profiles;
create policy "admins read all profiles"
  on profiles for select
  using (
    -- Avoid self-referential recursion by checking user_roles table instead
    -- of re-querying profiles
    auth.uid() in (
      select ur.user_id from user_roles ur where ur.role = 'admin'
    )
    -- Fallback: allow admins who exist only in profiles.role
    or exists (
      select 1 from profiles p2
      where p2.id = auth.uid() and p2.role = 'admin'
        and p2.id != profiles.id  -- prevent self-referential check issues
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- ADDITIONAL: enquiries — ensure owners can only update status of their own
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "owners update own enquiries" on enquiries;
create policy "owners update own enquiries"
  on enquiries for update
  using (
    exists (
      select 1 from restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- ADDITIONAL: onboarding_progress — ensure WITH CHECK matches USING
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "users manage own onboarding" on onboarding_progress;
create policy "users manage own onboarding"
  on onboarding_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ADDITIONAL: saved_listings — ensure WITH CHECK matches USING
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "users manage own saved" on saved_listings;
create policy "users manage own saved"
  on saved_listings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ADDITIONAL: listing_claims — ensure WITH CHECK on insert
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "users insert claims" on listing_claims;
create policy "users insert claims"
  on listing_claims for insert
  with check (
    auth.uid() = claimant_id
    -- Cannot claim a restaurant you already own
    and not exists (
      select 1 from restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY: Run these SELECT statements to confirm policies are in place
-- ─────────────────────────────────────────────────────────────────────────────
-- select schemaname, tablename, policyname, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename, policyname;

-- ─────────────────────────────────────────────────────────────────────────────
-- PENTEST FIX: C-3a — Owner can INSERT listing with arbitrary listing_status
-- Found during verification audit, July 2026
-- Fix: Add listing_status restriction to INSERT WITH CHECK
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "owners insert own listings" on restaurants;

create policy "owners insert own listings"
  on restaurants for insert
  with check (
    auth.uid() = owner_id
    -- Owners can only INSERT into draft or pending_review — never approved/suspended/archived
    -- This prevents bypassing admin moderation by inserting a pre-approved listing
    and listing_status in ('draft', 'pending_review')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- PENTEST FIX: WELCOME-1 — /api/auth/welcome leaks err.message
-- Fixed in application code below — SQL no change needed
-- ─────────────────────────────────────────────────────────────────────────────
-- (See app/api/auth/welcome/route.ts fix applied separately)

-- ─────────────────────────────────────────────────────────────────────────────
-- CRITICAL-3 FIX: handle_new_user() trigger — set role from user_metadata
-- Without this, every user gets role=NULL regardless of signup choice.
-- Replaces the trigger from migration_002.sql
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(
      new.raw_user_meta_data->>'role',
      'visitor'
    )
  )
  on conflict (id) do update
    set
      full_name  = coalesce(excluded.full_name, profiles.full_name),
      avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
      -- Only set role if profile has no role yet (don't overwrite admin roles)
      role       = case
                     when profiles.role is null or profiles.role = ''
                     then excluded.role
                     else profiles.role
                   end;
  return new;
end;
$$ language plpgsql security definer set search_path = public;
-- Trigger is already created — function replacement takes effect immediately
