export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('instagram_handle, full_name, role')
    .eq('id', user.id).single()

  if (!profile || profile.role !== 'influencer')
    return NextResponse.json({ error: 'Influencer account required' }, { status: 403 })

  // NOTE: this used to match via .ilike('handle', profile.instagram_handle) —
  // influencers.handle is a separately-typed field from the onboarding form,
  // not guaranteed to match profiles.instagram_handle verbatim (case,
  // whitespace, or an "@" prefix would all break an exact-ish ilike match).
  // That silent mismatch was throwing this whole route into the "no listing
  // yet" fallback below for real influencers who DO have a listing — which
  // is why the Analytics page showed "undefined" everywhere (that fallback
  // object is missing several fields the UI reads unconditionally).
  // profile_id is the same reliable account↔listing link already used by
  // InfluencerDashboard.tsx and the admin panel.
  const { data: inf } = await (supabase as any)
    .from('influencers')
    .select('id, name, handle, platform, slug, followers_count, impact_score, engagement_rate, trust_score, visits_driven_weekly, avg_views, rank_this_week, rank_last_week')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!inf) {
    // Return empty analytics for new influencer not yet in directory —
    // shaped identically to the real response below so the UI never has to
    // guess which fields exist.
    return NextResponse.json({
      influencer: null,
      kpis: {
        total_views: 0, total_visits: 0, total_posts: 0, total_likes: 0, total_comments: 0,
        avg_engagement: 0, followers: 0, rank: null, rank_last_week: null,
        impact_score: 0, trust_score: 0,
      },
      trend: [], posts: [], campaigns: [], top_restaurants: [],
      period_comparison: {
        views_change: 0, visits_change: 0, posts_change: 0,
        this_week_views: 0, last_week_views: 0, this_week_visits: 0, last_week_visits: 0,
      },
    })
  }

  // Get all posts
  const { data: posts } = await (supabase as any)
    .from('influencer_restaurant_posts')
    .select('id, views, likes, comments, visits_driven, posted_at, caption, restaurant:restaurants(id, name, emoji, slug, area_label)')
    .eq('influencer_id', inf.id)
    .order('posted_at', { ascending: false })
    .limit(50)

  const allPosts = posts ?? []

  // KPIs
  const totalViews    = allPosts.reduce((s: number, p: any) => s + (p.views ?? 0), 0)
  const totalVisits   = allPosts.reduce((s: number, p: any) => s + (p.visits_driven ?? 0), 0)
  const totalLikes    = allPosts.reduce((s: number, p: any) => s + (p.likes ?? 0), 0)
  const totalComments = allPosts.reduce((s: number, p: any) => s + (p.comments ?? 0), 0)
  const avgEngagement = totalViews > 0
    ? Math.round(((totalLikes + totalComments) / totalViews) * 1000) / 10
    : 0

  // 7-day trend from analytics table (fallback: derive from posts)
  const { data: analyticsRows } = await (supabase as any)
    .from('influencer_analytics')
    .select('date, total_views, visits_driven, posts_count, engagement_rate, followers_count')
    .eq('influencer_id', inf.id)
    .gte('date', new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10))
    .order('date', { ascending: true })

  // If no analytics snapshots, derive from posts grouped by week
  let trend: any[] = analyticsRows ?? []
  if (trend.length === 0 && allPosts.length > 0) {
    const byDay: Record<string, { views: number; visits: number; posts: number }> = {}
    allPosts.forEach((p: any) => {
      const day = (p.posted_at ?? '').slice(0, 10)
      if (!day) return
      if (!byDay[day]) byDay[day] = { views: 0, visits: 0, posts: 0 }
      byDay[day].views   += p.views ?? 0
      byDay[day].visits  += p.visits_driven ?? 0
      byDay[day].posts   += 1
    })
    trend = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, v]) => ({ date, total_views: v.views, visits_driven: v.visits, posts_count: v.posts }))
  }

  // Period comparison: last 7 days vs prior 7 days
  const now    = Date.now()
  const d7ago  = now - 7 * 86400_000
  const d14ago = now - 14 * 86400_000
  const thisWeek  = allPosts.filter((p: any) => new Date(p.posted_at).getTime() > d7ago)
  const lastWeek  = allPosts.filter((p: any) => { const t = new Date(p.posted_at).getTime(); return t > d14ago && t <= d7ago })
  const twViews   = thisWeek.reduce((s: number, p: any) => s + (p.views ?? 0), 0)
  const lwViews   = lastWeek.reduce((s: number, p: any) => s + (p.views ?? 0), 0)
  const twVisits  = thisWeek.reduce((s: number, p: any) => s + (p.visits_driven ?? 0), 0)
  const lwVisits  = lastWeek.reduce((s: number, p: any) => s + (p.visits_driven ?? 0), 0)
  const pct = (a: number, b: number) => b === 0 ? (a > 0 ? 100 : 0) : Math.round(((a - b) / b) * 100)

  // Top restaurants by visits driven
  const restMap: Record<string, { name: string; emoji: string; slug: string; visits: number; views: number; posts: number }> = {}
  allPosts.forEach((p: any) => {
    const r = p.restaurant
    if (!r) return
    if (!restMap[r.id]) restMap[r.id] = { name: r.name, emoji: r.emoji, slug: r.slug, visits: 0, views: 0, posts: 0 }
    restMap[r.id].visits += p.visits_driven ?? 0
    restMap[r.id].views  += p.views ?? 0
    restMap[r.id].posts  += 1
  })
  const topRestaurants = Object.values(restMap).sort((a, b) => b.visits - a.visits).slice(0, 5)

  // Campaigns
  const { data: campaigns } = await (supabase as any)
    .from('influencer_campaigns')
    .select('id, campaign_name, status, start_date, end_date, agreed_fee, restaurant:restaurants(id, name, emoji)')
    .eq('influencer_id', inf.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    influencer: inf,
    kpis: {
      total_views:    totalViews,
      total_visits:   totalVisits,
      total_posts:    allPosts.length,
      total_likes:    totalLikes,
      total_comments: totalComments,
      avg_engagement: avgEngagement,
      followers:      inf.followers_count ?? 0,
      rank:           inf.rank_this_week ?? null,
      rank_last_week: inf.rank_last_week ?? null,
      impact_score:   inf.impact_score ?? 0,
      trust_score:    inf.trust_score ?? 0,
    },
    trend,
    posts: allPosts.slice(0, 10),
    campaigns: campaigns ?? [],
    top_restaurants: topRestaurants,
    period_comparison: {
      views_change:  pct(twViews,  lwViews),
      visits_change: pct(twVisits, lwVisits),
      posts_change:  pct(thisWeek.length, lastWeek.length),
      this_week_views:  twViews,
      last_week_views:  lwViews,
      this_week_visits: twVisits,
      last_week_visits: lwVisits,
    },
  })
}
