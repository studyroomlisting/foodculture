-- ============================================================================
-- MIGRATION 011 — Fix "infinite recursion detected in policy for relation
-- restaurants" on EVERY update to a restaurant (edit listing, submit for
-- review, admin approve/reject — all of it), plus a real admin-detection
-- bug this uncovered.
--
-- ── Bug 1: the recursion ────────────────────────────────────────────────
-- migration_003_security.sql's "owners update own listings" policy tried to
-- block owners from changing listing_status/approved_at/rejection_reason by
-- comparing the new value to the row's current value via a correlated
-- subquery:
--
--   listing_status = (select listing_status from restaurants where id = restaurants.id)
--
-- Inside that subquery, the unaliased `restaurants` in the FROM clause
-- shadows the outer reference, so `restaurants.id` resolves to the SAME
-- subquery row instead of the row being updated — Postgres rewrites it to
-- `restaurants_1.id = restaurants_1.id` (always true, for every row). To
-- evaluate that subquery, Postgres has to run restaurants' own RLS policies
-- again — which includes this very policy — infinite recursion. This broke
-- every restaurant UPDATE: editing a listing, and the dashboard's
-- "Submit for review" button (which failed silently — the app code just
-- doesn't show a banner for that particular call).
--
-- Fix: move the "owners can't touch approval fields, except the one
-- allowed transition (draft/rejected -> pending_review)" rule into a
-- BEFORE UPDATE trigger, where OLD/NEW are real, unambiguous row
-- references — no self-querying the table at all, so no recursion is
-- possible. The RLS policy itself goes back to a plain ownership check.
--
-- ── Bug 2 (found while testing bug 1's fix): is_admin() checks the wrong
-- table ────────────────────────────────────────────────────────────────
-- migration_008's is_admin() checks `user_roles` for an admin row. Nothing
-- in this app ever inserts into `user_roles` — admin status everywhere
-- else (every other RLS policy, the /api/admin/* routes, middleware.ts'
-- /admin route guard) is `profiles.role = 'admin'`. So is_admin() has
-- always returned false for real admins, which silently broke:
--   - the "admins read all profiles" policy (migration_008) — an admin's
--     own Admin dashboard Users tab loaded via the anon-key browser client
--     would come back empty, since only their own profile row was visible.
--   - this migration's own admin bypass, if left unfixed.
-- SECURITY DEFINER is what breaks the recursion (it bypasses RLS for its
-- internal query), not which table it queries — so pointing it at
-- `profiles.role` instead is safe and matches how admin status is
-- determined everywhere else in the app.
--
-- ── Bug 3: onboarding_role can't be 'admin' ─────────────────────────────
-- handle_new_user() sets onboarding_role := role, and its own validation
-- allows role in ('visitor','owner','influencer','admin') — but the
-- profiles_onboarding_role_check constraint (migration_009) only allowed
-- ('visitor','owner','influencer'). Creating a user with role: 'admin' in
-- their metadata (e.g. via POST /api/admin/users, or Supabase's
-- admin.createUser) would crash the signup trigger outright. Widen it to
-- match.
--
-- Run AFTER migration_010_fix_user_delete_fks.sql.
-- ============================================================================

-- ── Bug 2 fix ────────────────────────────────────────────────────────────
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ── Bug 3 fix ────────────────────────────────────────────────────────────
alter table profiles drop constraint if exists profiles_onboarding_role_check;
alter table profiles add constraint profiles_onboarding_role_check
  check (onboarding_role in ('visitor','owner','influencer','admin'));

-- ── Bug 1 fix ────────────────────────────────────────────────────────────
drop policy if exists "owners update own listings" on restaurants;
create policy "owners update own listings"
  on restaurants for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create or replace function protect_restaurant_status_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admin actions (including the /api/admin/listing-status route, which
  -- already verifies role = 'admin' server-side) and any service-role /
  -- system context (auth.uid() is null) go through untouched.
  if auth.uid() is null or is_admin() then
    return new;
  end if;

  -- Non-admin owners may only move their OWN draft/rejected listing to
  -- pending_review — that's the dashboard's "Submit for review" button.
  -- Any other attempted status change is silently ignored (reverted to the
  -- current value) rather than failing the whole update, so a normal
  -- listing edit (which never touches these columns) is never affected.
  if new.listing_status is distinct from old.listing_status then
    if not (old.listing_status in ('draft','rejected') and new.listing_status = 'pending_review') then
      new.listing_status := old.listing_status;
    end if;
  end if;
  new.approved_at      := old.approved_at;
  new.rejection_reason := old.rejection_reason;
  new.owner_id          := old.owner_id;
  return new;
end;
$$;

drop trigger if exists trg_protect_restaurant_status on restaurants;
create trigger trg_protect_restaurant_status
  before update on restaurants
  for each row execute function protect_restaurant_status_columns();
