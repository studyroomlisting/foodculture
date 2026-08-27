/**
 * lib/queries.ts — All Supabase read queries
 * All queries: explicit column selects, DB-side pagination, Promise.all for parallel fetches
 */
import { supabase } from './supabase'
import type { Restaurant, Influencer, Dish, Deal, Review, ActivityFeedItem, Zone, InfluencerRestaurantPost } from '@/types/database'

const RESTAURANT_CARD_COLS = 'id,slug,name,emoji,zone_id,area_label,cuisine_tags,price_tier,avg_spend,rating,total_reviews,intelligence_score,intelligence_score_trend,status,listing_status,open_until,listing_images(url,is_primary)'
const RESTAURANT_FULL_COLS = 'id,slug,name,emoji,zone_id,location_id,owner_id,area_label,cuisine_tags,price_tier,avg_spend,rating,total_reviews,intelligence_score,intelligence_score_trend,status,listing_status,open_until,peak_hours,ai_brief,listing_images(url,alt_text,is_primary,sort_order)'
// NOTE: must include every column InfluencerProfileLive.tsx (and any other
// consumer) actually renders — active_cities/avg_views/fake_follower_pct/
// response_time_label were missing here, so influencer.active_cities was
// `undefined` (not null — simply absent from the selected row) on every
// single influencer detail page, and `undefined.join(...)` crashed the
// whole page with a client-side exception. The component also has its own
// `?? []` / `?? '—'` fallbacks now as a second line of defence, but the
// query needs to actually fetch the data for those to have anything to show.
const INFLUENCER_COLS = 'id,slug,name,handle,platform,avatar_initials,avatar_url,bio,followers_count,cuisine_tags,impact_score,trust_score,engagement_rate,fake_follower_pct,visits_driven_weekly,avg_views,response_time_label,active_cities,connection_fee,rank_this_week,pricing_tiers:influencer_pricing_tiers(id,tier_name,price,deliverables,estimated_reach,turnaround_days)'

// ─── RESTAURANTS ────────────────────────────────────────────────────────────

export async function getTrendingRestaurants(limit = 6): Promise<Restaurant[]> {
  const { data, error } = await (supabase as any).from('restaurants').select(RESTAURANT_CARD_COLS).eq('listing_status','approved').order('intelligence_score',{ascending:false}).limit(limit)
  if (error) throw error
  return (data ?? []) as unknown as Restaurant[]
}

export async function getRestaurants(opts?: { zone_id?: string; status?: string; cuisine?: string; search?: string; limit?: number; offset?: number }): Promise<{ data: Restaurant[]; count: number }> {
  const limit  = opts?.limit  ?? 12
  const offset = opts?.offset ?? 0

  // A search term needs to match against the WHOLE restaurants table (name,
  // area, and cuisine tags — including a partial match inside a tag), not
  // just whichever page of restaurants happens to already be loaded. Route
  // search through the search_restaurant_ids() DB function (migration_019)
  // to get the correct page of matching ids plus a real total count, then
  // fetch those specific rows with the normal card columns — this keeps the
  // listing_images join working exactly as it does for the no-search path.
  if (opts?.search && opts.search.trim()) {
    const { data: hits, error: rpcErr } = await (supabase as any).rpc('search_restaurant_ids', {
      p_query: opts.search.trim(), p_limit: limit, p_offset: offset,
    })
    if (rpcErr) throw rpcErr
    const ids = ((hits ?? []) as any[]).map(h => h.id)
    const total = ((hits ?? [])[0] as any)?.total_count ?? 0
    if (ids.length === 0) return { data: [], count: Number(total) }

    let q2 = (supabase as any).from('restaurants').select(RESTAURANT_CARD_COLS).in('id', ids)
    if (opts.zone_id) q2 = q2.eq('zone_id', opts.zone_id)
    if (opts.status)  q2 = q2.eq('status',  opts.status)
    if (opts.cuisine) q2 = q2.contains('cuisine_tags', [opts.cuisine])
    const { data: rows, error: rowsErr } = await q2
    if (rowsErr) throw rowsErr

    // .in() doesn't preserve row order — re-sort to match the ranked order
    // the search function already computed (by intelligence_score).
    const byId = new Map(((rows ?? []) as any[]).map(r => [r.id, r]))
    const ordered = ids.map(id => byId.get(id)).filter(Boolean)
    return { data: ordered as unknown as Restaurant[], count: Number(total) }
  }

  let q = (supabase as any).from('restaurants').select(RESTAURANT_CARD_COLS, { count: 'exact' }).eq('listing_status','approved').order('intelligence_score',{ascending:false}).range(offset, offset + limit - 1)
  if (opts?.zone_id) q = q.eq('zone_id', opts.zone_id)
  if (opts?.status)  q = q.eq('status',  opts.status)
  if (opts?.cuisine) q = q.contains('cuisine_tags', [opts.cuisine])
  const { data, error, count } = await q
  if (error) throw error
  return { data: (data ?? []) as unknown as Restaurant[], count: count ?? 0 }
}

export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const { data, error } = await (supabase as any).from('restaurants').select(RESTAURANT_FULL_COLS).eq('slug', slug).eq('listing_status','approved').single()
  if (error) return null
  return data as unknown as Restaurant
}

export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  const { data, error } = await (supabase as any).from('restaurants').select(RESTAURANT_FULL_COLS).eq('id', id).single()
  if (error) return null
  return data as unknown as Restaurant
}

// ─── REVIEWS ────────────────────────────────────────────────────────────────

export async function getReviews(restaurant_id: string, limit = 10): Promise<Review[]> {
  const { data, error } = await (supabase as any).from('reviews').select('id,restaurant_id,reviewer_name,rating,body,verified_visit,created_at').eq('restaurant_id', restaurant_id).order('created_at',{ascending:false}).limit(limit)
  if (error) throw error
  return data ?? []
}

// ─── DISHES ─────────────────────────────────────────────────────────────────

export async function getTrendingDishes(limit = 8): Promise<Dish[]> {
  const { data, error } = await (supabase as any).from('dishes').select('id,name,emoji,trend_label,restaurant_count').order('restaurant_count',{ascending:false}).limit(limit)
  if (error) throw error
  return data ?? []
}

// ─── ZONES ──────────────────────────────────────────────────────────────────

export async function getTrendingZones(): Promise<Zone[]> {
  const { data, error } = await (supabase as any).from('zones').select('id,name,slug,trend_score,restaurant_count').order('trend_score',{ascending:false})
  if (error) throw error
  return data ?? []
}

// ─── INFLUENCERS ────────────────────────────────────────────────────────────

export async function getInfluencers(opts?: { platform?: string; cuisine?: string; search?: string; limit?: number; offset?: number }): Promise<{ data: Influencer[]; count: number }> {
  const limit  = opts?.limit  ?? 12
  const offset = opts?.offset ?? 0

  // Same fix as getRestaurants() above: search the WHOLE influencers table
  // (name, handle, and cuisine tags) via search_influencer_ids()
  // (migration_019) instead of only ever searching within whichever page
  // was already loaded, then fetch those specific rows with the normal
  // columns so the pricing_tiers join keeps working as before.
  if (opts?.search && opts.search.trim()) {
    const { data: hits, error: rpcErr } = await (supabase as any).rpc('search_influencer_ids', {
      p_query: opts.search.trim(), p_limit: limit, p_offset: offset,
    })
    if (rpcErr) throw rpcErr
    const ids = ((hits ?? []) as any[]).map(h => h.id)
    const total = ((hits ?? [])[0] as any)?.total_count ?? 0
    if (ids.length === 0) return { data: [], count: Number(total) }

    let q2 = (supabase as any).from('influencers').select(INFLUENCER_COLS).in('id', ids)
    if (opts.platform) q2 = q2.eq('platform', opts.platform)
    if (opts.cuisine)  q2 = q2.contains('cuisine_tags', [opts.cuisine])
    const { data: rows, error: rowsErr } = await q2
    if (rowsErr) throw rowsErr

    // .in() doesn't preserve row order — re-sort to match the ranked order
    // the search function already computed (by rank_this_week).
    const byId = new Map(((rows ?? []) as any[]).map(r => [r.id, r]))
    const ordered = ids.map(id => byId.get(id)).filter(Boolean)
    return { data: ordered as unknown as Influencer[], count: Number(total) }
  }

  let q = (supabase as any).from('influencers').select(INFLUENCER_COLS, { count: 'exact' }).order('rank_this_week',{ascending:true,nullsFirst:false}).range(offset, offset + limit - 1)
  if (opts?.platform) q = q.eq('platform', opts.platform)
  if (opts?.cuisine)  q = q.contains('cuisine_tags', [opts.cuisine])
  const { data, error, count } = await q
  if (error) throw error
  return { data: (data ?? []) as unknown as Influencer[], count: count ?? 0 }
}

// Real platform-wide counts for the homepage stats strip, which used to
// show hardcoded numbers ("1.2K", "48K", "544+") no matter how many
// restaurants/reviews/influencers actually existed. `head: true` makes
// Supabase return only the count, not the rows, so this stays cheap.
export async function getPlatformStats(): Promise<{ restaurants: number; reviews: number; influencers: number }> {
  const [{ count: restaurants }, { count: reviews }, { count: influencers }] = await Promise.all([
    (supabase as any).from('restaurants').select('id', { count: 'exact', head: true }).eq('listing_status', 'approved'),
    (supabase as any).from('reviews').select('id', { count: 'exact', head: true }),
    (supabase as any).from('influencers').select('id', { count: 'exact', head: true }),
  ])
  return { restaurants: restaurants ?? 0, reviews: reviews ?? 0, influencers: influencers ?? 0 }
}

export async function getInfluencerBySlug(slug: string): Promise<Influencer | null> {
  const { data, error } = await (supabase as any).from('influencers').select(INFLUENCER_COLS).eq('slug', slug).single()
  if (error) return null
  return data as unknown as Influencer
}

export async function getInfluencerById(id: string): Promise<Influencer | null> {
  const { data, error } = await (supabase as any).from('influencers').select(INFLUENCER_COLS).eq('id', id).single()
  if (error) return null
  return data as unknown as Influencer
}

export async function getInfluencerPosts(influencer_id: string, limit = 5): Promise<InfluencerRestaurantPost[]> {
  const { data, error } = await (supabase as any).from('influencer_restaurant_posts').select('id,influencer_id,restaurant_id,caption,views,likes,comments,visits_driven,posted_at,restaurant:restaurants(id,name,emoji,area_label)').eq('influencer_id', influencer_id).order('posted_at',{ascending:false}).limit(limit)
  if (error) throw error
  return data ?? []
}

export async function getPostsForRestaurant(restaurant_id: string, limit = 5): Promise<InfluencerRestaurantPost[]> {
  const { data, error } = await (supabase as any).from('influencer_restaurant_posts').select('id,influencer_id,restaurant_id,caption,views,likes,comments,visits_driven,posted_at,influencer:influencers(id,name,handle,avatar_initials,avatar_url,followers_count,impact_score)').eq('restaurant_id', restaurant_id).order('posted_at',{ascending:false}).limit(limit)
  if (error) throw error
  return data ?? []
}

// ─── DEALS ──────────────────────────────────────────────────────────────────

export async function getDealsForRestaurant(restaurant_id: string): Promise<Deal[]> {
  const { data, error } = await (supabase as any).from('deals').select('id,restaurant_id,title,description,code,savings_label,color_theme,expires_at,active').eq('restaurant_id', restaurant_id).eq('active', true).order('expires_at',{ascending:true})
  if (error) throw error
  return data ?? []
}

export async function getAllActiveDeals(): Promise<Deal[]> {
  const now = new Date().toISOString()
  const { data, error } = await (supabase as any).from('deals').select('id,restaurant_id,title,description,code,savings_label,color_theme,expires_at,active,restaurant:restaurants(id,slug,name,emoji,area_label)').eq('active', true).or('expires_at.is.null,expires_at.gt.' + now).order('expires_at',{ascending:true,nullsFirst:false})
  if (error) throw error
  return data ?? []
}

// ─── ACTIVITY FEED ──────────────────────────────────────────────────────────

export async function getActivityFeed(limit = 10): Promise<ActivityFeedItem[]> {
  const { data, error } = await (supabase as any).from('activity_feed').select('id,message,dot_color,created_at').order('created_at',{ascending:false}).limit(limit)
  if (error) throw error
  return data ?? []
}

// ─── DASHBOARD STATS — parallel ─────────────────────────────────────────────

export async function getDashboardStats(restaurant_id: string) {
  const [postsResult, dealsResult, reviewsResult] = await Promise.all([
    (supabase as any).from('influencer_restaurant_posts').select('views,likes,comments,visits_driven').eq('restaurant_id', restaurant_id),
    (supabase as any).from('deals').select('id').eq('restaurant_id', restaurant_id).eq('active', true),
    (supabase as any).from('reviews').select('rating').eq('restaurant_id', restaurant_id),
  ])
  const posts   = (postsResult.data   ?? []) as any[]
  const deals   = (dealsResult.data   ?? []) as any[]
  const reviews = (reviewsResult.data ?? []) as any[]
  return {
    totalVisits:   posts.reduce((s:number, p:any) => s + (p.visits_driven ?? 0), 0),
    totalViews:    posts.reduce((s:number, p:any) => s + (p.views         ?? 0), 0),
    totalLikes:    posts.reduce((s:number, p:any) => s + (p.likes         ?? 0), 0),
    totalComments: posts.reduce((s:number, p:any) => s + (p.comments      ?? 0), 0),
    totalPosts:    posts.length,
    activeDeals:   deals.length,
    totalReviews:  reviews.length,
    avgRating:     reviews.length ? (reviews.reduce((s:number,r:any) => s+(r.rating??0),0)/reviews.length).toFixed(1) : '—',
  }
}

// ─── CONNECTION REQUESTS ─────────────────────────────────────────────────────

export async function submitConnectionRequest(payload: { influencer_id: string; restaurant_name: string; requester_name: string; collab_interest?: string }): Promise<void> {
  const { error } = await (supabase as any).from('connection_requests').insert([{ ...payload, status: 'pending' }])
  if (error) throw error
}
