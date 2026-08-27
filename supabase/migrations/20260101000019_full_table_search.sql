-- migration_019_full_table_search.sql
-- Real database-level search for restaurants & influencers on /explore
-- (and the homepage hero search, which redirects there).
--
-- ROOT CAUSE this fixes: ExplorePageLive.tsx only ever fetched the first
-- 12 restaurants (ordered by intelligence_score) and first 12 influencers
-- (ordered by rank_this_week) ONE TIME on page load, then filtered THOSE
-- SAME 12-and-12 records in the browser as the user typed. Any restaurant
-- or influencer that matched the search term but wasn't already inside
-- that first page of 12 (e.g. any newer or lower-scored restaurant) could
-- never appear in a search result, no matter how exact the match — which
-- is exactly why search felt useless.
--
-- FIX: two small read-only Postgres functions that search the WHOLE
-- table (name, area/handle, and cuisine tags — including partial matches
-- inside a tag, which a plain array "contains" filter can't do), and
-- return a real total match count for pagination. They return ids + a
-- window-function count only (not full rows), so the application layer
-- can still fetch full card data (including the listing_images /
-- pricing_tiers joins) through the existing typed select — this migration
-- only changes *which* rows get matched, not how they're shaped for the UI.
--
-- SECURITY INVOKER (the default — no "security definer" here) means these
-- functions run as whichever role calls them and are still bound by the
-- existing "public read approved restaurants" / "public read influencers"
-- RLS policies, exactly like the plain selects they replace.

create or replace function search_restaurant_ids(
  p_query text,
  p_limit int default 12,
  p_offset int default 0
)
returns table (id uuid, total_count bigint)
language sql
stable
as $$
  select r.id, count(*) over() as total_count
  from restaurants r
  where r.listing_status = 'approved'
    and (
      p_query is null or btrim(p_query) = '' or
      r.name ilike '%' || p_query || '%' or
      r.area_label ilike '%' || p_query || '%' or
      exists (select 1 from unnest(r.cuisine_tags) t where t ilike '%' || p_query || '%')
    )
  order by r.intelligence_score desc nulls last, r.id
  limit p_limit offset p_offset
$$;

grant execute on function search_restaurant_ids(text, int, int) to anon, authenticated;

create or replace function search_influencer_ids(
  p_query text,
  p_limit int default 12,
  p_offset int default 0
)
returns table (id uuid, total_count bigint)
language sql
stable
as $$
  select i.id, count(*) over() as total_count
  from influencers i
  where (
    p_query is null or btrim(p_query) = '' or
    i.name ilike '%' || p_query || '%' or
    i.handle ilike '%' || p_query || '%' or
    exists (select 1 from unnest(i.cuisine_tags) t where t ilike '%' || p_query || '%')
  )
  order by i.rank_this_week asc nulls last, i.id
  limit p_limit offset p_offset
$$;

grant execute on function search_influencer_ids(text, int, int) to anon, authenticated;
