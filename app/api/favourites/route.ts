export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function getClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  )
}

// GET — return all favourites (restaurants + influencers + saved_searches)
export async function GET(request: NextRequest) {
  const supabase = getClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [{ data: restaurants }, { data: searches }] = await Promise.all([
    (supabase as any).from('saved_listings').select('id,restaurant_id,created_at,restaurant:restaurants(id,slug,name,emoji,area_label,rating,intelligence_score,listing_status)').eq('user_id', user.id).order('created_at', { ascending: false }),
    (supabase as any).from('saved_searches').select('id,query,filters,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
  ])
  return NextResponse.json({ restaurants: restaurants ?? [], searches: searches ?? [] })
}

// POST — add favourite restaurant
export async function POST(request: NextRequest) {
  const supabase = getClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (body.type === 'restaurant' && body.restaurant_id) {
      if (!/^[0-9a-f-]{36}$/i.test(body.restaurant_id))
        return NextResponse.json({ error: 'Invalid restaurant_id.' }, { status: 400 })
      const { error } = await (supabase as any).from('saved_listings').insert([{ user_id: user.id, restaurant_id: body.restaurant_id }])
      if (error?.code === '23505') return NextResponse.json({ success: true, message: 'Already saved.' })
      if (error) return NextResponse.json({ error: 'Failed to save.' }, { status: 500 })
    } else if (body.type === 'search' && body.query) {
      const query = String(body.query).slice(0, 200)
      await (supabase as any).from('saved_searches').insert([{ user_id: user.id, query, filters: body.filters ?? {} }])
    } else {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 })
  }
}

// DELETE — remove favourite
export async function DELETE(request: NextRequest) {
  const supabase = getClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    if (body.type === 'restaurant' && body.restaurant_id) {
      await (supabase as any).from('saved_listings').delete().eq('user_id', user.id).eq('restaurant_id', body.restaurant_id)
    } else if (body.type === 'search' && body.id) {
      await (supabase as any).from('saved_searches').delete().eq('user_id', user.id).eq('id', body.id)
    } else {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 })
  }
}
