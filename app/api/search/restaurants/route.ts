export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ALLOWED_SORTS    = ['score','rating','name','newest'] as const
const ALLOWED_TIERS    = ['₹','₹₹','₹₹₹','₹₹₹₹']
const ALLOWED_RATINGS  = [3, 3.5, 4, 4.5]
const ALLOWED_STATUSES = ['all','viral','rising','new','active']
const MAX_LIMIT = 48

function san(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

export async function POST(request: NextRequest) {
  const start = Date.now()
  try {
    const body = await request.json()

    const q          = san(body.q, 100)
    const zone_id    = san(body.zone_id, 36)
    const status     = ALLOWED_STATUSES.includes(body.status) ? body.status : 'all'
    const sort       = ALLOWED_SORTS.includes(body.sort) ? body.sort : 'score'
    const limit      = Math.min(Math.max(parseInt(body.limit) || 12, 1), MAX_LIMIT)
    const offset     = Math.max(parseInt(body.offset) || 0, 0)
    const minRating  = ALLOWED_RATINGS.includes(Number(body.min_rating)) ? Number(body.min_rating) : null
    const priceTiers = Array.isArray(body.price_tiers) ? body.price_tiers.filter((t: string) => ALLOWED_TIERS.includes(t)) : []
    const cuisines   = Array.isArray(body.cuisines)    ? body.cuisines.map((c: string) => san(c, 50)).filter(Boolean).slice(0, 10) : []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )

    const COLS = 'id,slug,name,emoji,zone_id,area_label,cuisine_tags,price_tier,avg_spend,rating,total_reviews,intelligence_score,intelligence_score_trend,status,listing_status,open_until,listing_images(url,is_primary)'

    let query = (supabase as any)
      .from('restaurants')
      .select(COLS, { count: 'exact' })
      .eq('listing_status', 'approved')

    // Full-text search (uses GIN index on search_vector)
    if (q) {
      const ftsQuery = q.trim().split(/\s+/).map((w: string) => w + ':*').join(' & ')
      query = query.textSearch('search_vector', ftsQuery, { type: 'websearch', config: 'english' })
    }

    if (zone_id)              query = query.eq('zone_id', zone_id)
    if (status !== 'all')     query = query.eq('status', status)
    if (minRating !== null)   query = query.gte('rating', minRating)
    if (priceTiers.length > 0) query = query.in('price_tier', priceTiers)
    for (const c of cuisines) query = query.contains('cuisine_tags', [c])

    const orderCol = sort === 'rating' ? 'rating' : sort === 'name' ? 'name' : sort === 'newest' ? 'approved_at' : 'intelligence_score'
    query = query.order(orderCol, { ascending: sort === 'name' }).range(offset, offset + limit - 1)

    let { data, error, count } = await query

    // Fallback: if FTS column missing, use ILIKE
    if (error?.message?.includes('search_vector') || error?.message?.includes('column')) {
      let fb = (supabase as any)
        .from('restaurants')
        .select(COLS, { count: 'exact' })
        .eq('listing_status', 'approved')
      if (q) fb = fb.or(`name.ilike.%${q}%,area_label.ilike.%${q}%`)
      if (zone_id) fb = fb.eq('zone_id', zone_id)
      if (status !== 'all') fb = fb.eq('status', status)
      if (minRating !== null) fb = fb.gte('rating', minRating)
      if (priceTiers.length > 0) fb = fb.in('price_tier', priceTiers)
      fb = fb.order(orderCol, { ascending: sort === 'name' }).range(offset, offset + limit - 1)
      const res = await fb
      data = res.data ?? []; count = res.count ?? 0; error = null
    }

    if (error) return NextResponse.json({ error: 'Search failed' }, { status: 500 })

    return NextResponse.json({ data: data ?? [], count: count ?? 0, elapsed_ms: Date.now() - start })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
