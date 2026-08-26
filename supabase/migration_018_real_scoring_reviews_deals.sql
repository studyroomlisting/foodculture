-- ============================================================================
-- MIGRATION 018 — Three separate real gaps, all found while walking through
-- a full owner+influencer+admin test pass end to end:
--
-- 0) REVIEWS WERE COMPLETELY BROKEN AT THE SCHEMA LEVEL. app/api/reviews/
--    route.ts and app/api/activity/route.ts have always read/written a
--    `reviews.reviewer_id` column — but no migration, ever, actually added
--    that column to the table (only `reviewer_name` exists). Every single
--    review submission has been failing at the database with "column
--    reviewer_id does not exist" since this feature was first built — not
--    an RLS issue, not a missing UI issue, the column itself was never
--    created. This is why "review submit karne par kuch nahi hota": the
--    request 500s, and the client never surfaced that error (fixed in the
--    same code drop as this migration). Fixed here by actually adding the
--    column the app has always assumed existed.
--
-- 1) REVIEWS. `reviews` had an INSERT policy (migration_003) but NO update-
--    own or delete-own policy — a user could never edit/delete their own
--    review (the /api/reviews PATCH/DELETE routes already assumed they
--    could). Also: nothing anywhere recomputed restaurants.rating /
--    total_reviews when a review was added — those columns only ever held
--    whatever seed.sql put there, forever. Fixed with real INSERT/UPDATE/
--    DELETE-own policies + a trigger that recomputes rating/total_reviews
--    from the actual reviews table.
--
-- 2) SCORING. restaurants.intelligence_score / status ("viral"/"rising"/
--    "new"/"active") and influencers.impact_score / engagement_rate /
--    trust_score / rank_this_week are all `default 0` columns that NOTHING
--    ever computes for a real (non-seed) restaurant or influencer — they
--    are permanently 0/'active', which is why a real owner's or real
--    influencer's listing can never rank on /trending, the homepage, or
--    "AI Score" sort, no matter how good their real reviews/collabs are.
--    Only seed.sql's hand-picked demo rows ever had real-looking numbers.
--    Fixed with a simple, transparent, automatically-computed formula
--    (see compute_restaurant_score / compute_influencer_score below) that
--    runs whenever real signals change (a review, a logged collaboration).
--    Scoped to owner_id/profile_id IS NOT NULL only, so seed/demo rows
--    (which have neither) are never touched — their curated numbers are
--    left exactly as they are today.
--
-- 3) DEALS. The `deals` table had a SELECT policy but no INSERT/UPDATE/
--    DELETE policy for anyone — and no UI anywhere let an owner create one
--    either. The public /deals page's own copy ("Restaurant owners can add
--    deals from their dashboard") was aspirational, not real. This
--    migration unlocks the DB side; the matching dashboard UI ships in the
--    same code drop as this migration.
--
-- Run AFTER migration_017_admin_manage_collaboration_posts.sql.
-- ============================================================================

-- ── 0) THE MISSING COLUMN ───────────────────────────────────────────────

alter table reviews add column if not exists reviewer_id uuid references profiles(id) on delete set null;
create index if not exists idx_reviews_reviewer on reviews(reviewer_id);

-- ── 1) REVIEWS ───────────────────────────────────────────────────────────

drop policy if exists "users update own reviews" on reviews;
create policy "users update own reviews"
  on reviews for update
  using (auth.uid() = reviewer_id)
  with check (auth.uid() = reviewer_id);

drop policy if exists "users delete own reviews" on reviews;
create policy "users delete own reviews"
  on reviews for delete
  using (auth.uid() = reviewer_id);

create or replace function recompute_restaurant_rating()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  rid uuid := coalesce(new.restaurant_id, old.restaurant_id);
  v_owner_id uuid;
  v_rating numeric;
  v_count int;
begin
  select owner_id into v_owner_id from restaurants where id = rid;

  -- Same rule as compute_restaurant_score below: a seed/demo restaurant
  -- (owner_id is null) keeps its hand-picked rating/total_reviews forever,
  -- even if a real visitor leaves a genuine review on it — otherwise one
  -- stray real review could overwrite a curated "4.8 · 1,248 reviews" with
  -- "2.0 · 1 review" and visibly wreck the demo content.
  if v_owner_id is null then
    return coalesce(new, old);
  end if;

  select coalesce(round(avg(rating)::numeric, 1), 0), count(*)
    into v_rating, v_count
    from reviews where restaurant_id = rid;

  update restaurants
     set rating = v_rating,
         total_reviews = v_count,
         updated_at = now()
   where id = rid;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_recompute_restaurant_rating on reviews;
create trigger trg_recompute_restaurant_rating
  after insert or update or delete on reviews
  for each row execute function recompute_restaurant_rating();

-- ── 2) SCORING ───────────────────────────────────────────────────────────
-- Real, transparent formula — no black box. A restaurant earns points from:
-- real average rating (up to 35), review volume (up to 20, caps at ~7
-- reviews), distinct influencer collaborations (up to 30, caps at 3
-- influencers), and visits those collaborations actually drove (up to 15).
-- Status: 'new' for the first 14 days after approval, then 'viral' / 'rising'
-- / 'active' by score threshold — never self-declared by the owner, always
-- earned from real reviews + real logged collaborations.

create or replace function compute_restaurant_score(p_restaurant_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_owner_id uuid;
  v_approved_at timestamptz;
  v_old_score int;
  v_rating numeric;
  v_reviews int;
  v_influencers int;
  v_visits int;
  v_score int;
  v_status text;
begin
  select owner_id, approved_at, intelligence_score
    into v_owner_id, v_approved_at, v_old_score
    from restaurants where id = p_restaurant_id;

  -- Seed/demo restaurants have no owner — leave their curated numbers alone.
  if v_owner_id is null then
    return;
  end if;

  select coalesce(round(avg(rating)::numeric, 1), 0), count(*)
    into v_rating, v_reviews
    from reviews where restaurant_id = p_restaurant_id;

  select count(distinct influencer_id), coalesce(sum(visits_driven), 0)
    into v_influencers, v_visits
    from influencer_restaurant_posts where restaurant_id = p_restaurant_id;

  v_score := least(100,
    round(v_rating / 5.0 * 35)
    + least(20, v_reviews * 3)
    + least(30, v_influencers * 10)
    + least(15, floor(v_visits / 10.0))
  );

  v_status := case
    when v_approved_at is not null and v_approved_at > now() - interval '14 days' then 'new'
    when v_score >= 75 then 'viral'
    when v_score >= 45 then 'rising'
    else 'active'
  end;

  update restaurants
     set intelligence_score = v_score,
         intelligence_score_trend = greatest(0, v_score - coalesce(v_old_score, 0)),
         status = v_status,
         updated_at = now()
   where id = p_restaurant_id;
end;
$$;

create or replace function trg_compute_restaurant_score_reviews()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  perform compute_restaurant_score(coalesce(new.restaurant_id, old.restaurant_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_score_on_review on reviews;
create trigger trg_score_on_review
  after insert or update or delete on reviews
  for each row execute function trg_compute_restaurant_score_reviews();

create or replace function trg_compute_scores_on_post()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  perform compute_restaurant_score(coalesce(new.restaurant_id, old.restaurant_id));
  perform compute_influencer_score(coalesce(new.influencer_id, old.influencer_id));
  return coalesce(new, old);
end;
$$;

-- Real influencer scoring, same philosophy: engagement (likes+comments /
-- views) drives impact, distinct restaurants + post count drive a modest
-- trust baseline, and rank_this_week is a live leaderboard position among
-- all real (profile_id is not null) influencers — recomputed every time
-- any one of them gets a new logged collaboration.

create or replace function compute_influencer_score(p_influencer_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_profile_id uuid;
  v_posts int;
  v_views bigint;
  v_likes bigint;
  v_comments bigint;
  v_visits_all bigint;
  v_visits_week bigint;
  v_restaurants int;
  v_engagement numeric;
  v_trust int;
  v_impact int;
begin
  select profile_id into v_profile_id from influencers where id = p_influencer_id;

  -- Seed/demo influencers have no linked account — leave them as curated.
  if v_profile_id is null then
    return;
  end if;

  select count(*), coalesce(sum(views), 0), coalesce(sum(likes), 0), coalesce(sum(comments), 0),
         coalesce(sum(visits_driven), 0), count(distinct restaurant_id)
    into v_posts, v_views, v_likes, v_comments, v_visits_all, v_restaurants
    from influencer_restaurant_posts where influencer_id = p_influencer_id;

  select coalesce(sum(visits_driven), 0) into v_visits_week
    from influencer_restaurant_posts
    where influencer_id = p_influencer_id and posted_at > now() - interval '7 days';

  v_engagement := case when v_views > 0 then round(((v_likes + v_comments) / v_views::numeric) * 1000) / 10 else 0 end;
  v_trust      := least(100, v_restaurants * 20 + least(30, v_posts * 5));
  v_impact     := least(100, round(v_engagement * 3) + least(30, floor(v_visits_all / 5.0)) + least(20, v_posts * 3));

  update influencers
     set engagement_rate = v_engagement,
         trust_score = v_trust,
         impact_score = v_impact,
         visits_driven_weekly = v_visits_week,
         avg_views = case when v_posts > 0 then round(v_views / v_posts::numeric) else 0 end
   where id = p_influencer_id;

  -- Live leaderboard: only ranks real (profile_id is not null) influencers
  -- against each other — seed/demo rows keep whatever rank they started with.
  update influencers i
     set rank_this_week = sub.rnk
    from (
      select id, row_number() over (order by impact_score desc, followers_count desc) as rnk
      from influencers where profile_id is not null
    ) sub
   where i.id = sub.id and i.profile_id is not null;
end;
$$;

drop trigger if exists trg_scores_on_post on influencer_restaurant_posts;
create trigger trg_scores_on_post
  after insert or update or delete on influencer_restaurant_posts
  for each row execute function trg_compute_scores_on_post();

-- Give a real restaurant its baseline score/status the moment it's approved
-- (so it shows as "new" immediately instead of sitting at 0/"active" until
-- its first review or collaboration).
create or replace function trg_compute_restaurant_score_on_approval()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.listing_status = 'approved' and (old.listing_status is distinct from new.listing_status) then
    perform compute_restaurant_score(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_score_on_approval on restaurants;
create trigger trg_score_on_approval
  after update on restaurants
  for each row execute function trg_compute_restaurant_score_on_approval();

-- ── 3) DEALS ─────────────────────────────────────────────────────────────

drop policy if exists "owners manage own deals" on deals;
create policy "owners manage own deals"
  on deals for all
  using (
    exists (select 1 from restaurants r where r.id = deals.restaurant_id and r.owner_id = auth.uid())
    or is_admin()
  )
  with check (
    exists (select 1 from restaurants r where r.id = deals.restaurant_id and r.owner_id = auth.uid())
    or is_admin()
  );
