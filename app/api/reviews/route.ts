export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function getClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  )
}

export async function POST(request: NextRequest) {
  const supabase = getClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to leave a review.' }, { status: 401 })
  try {
    const body = await request.json()
    const restaurant_id = String(body.restaurant_id || '')
    const rating = parseInt(body.rating)
    const reviewBody = String(body.body || '').trim()
    if (!/^[0-9a-f-]{36}$/i.test(restaurant_id)) return NextResponse.json({ error: 'Invalid restaurant.' }, { status: 400 })
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: 'Rating must be 1–5.' }, { status: 400 })
    if (reviewBody.length < 20) return NextResponse.json({ error: 'Review must be at least 20 characters.' }, { status: 400 })
    if (reviewBody.length > 1000) return NextResponse.json({ error: 'Review must be under 1000 characters.' }, { status: 400 })
    const { data: rest } = await (supabase as any).from('restaurants').select('id,listing_status').eq('id', restaurant_id).single()
    if (!rest || rest.listing_status !== 'approved') return NextResponse.json({ error: 'Restaurant not found.' }, { status: 404 })
    const since = new Date(Date.now() - 86400_000).toISOString()
    const { count } = await (supabase as any).from('reviews').select('id', { count: 'exact', head: true }).eq('reviewer_id', user.id).gte('created_at', since)
    if ((count ?? 0) >= 3) return NextResponse.json({ error: 'Max 3 reviews per day.' }, { status: 429 })
    const { data: existing } = await (supabase as any).from('reviews').select('id').eq('reviewer_id', user.id).eq('restaurant_id', restaurant_id).single()
    if (existing) return NextResponse.json({ error: 'You have already reviewed this restaurant.' }, { status: 409 })
    const { data: profile } = await (supabase as any).from('profiles').select('full_name').eq('id', user.id).single()
    const reviewer_name = profile?.full_name || user.email?.split('@')[0] || 'Anonymous'
    const { data: review, error: insErr } = await (supabase as any).from('reviews').insert([{ restaurant_id, reviewer_id: user.id, reviewer_name, rating, body: reviewBody }]).select('id,rating,body,reviewer_name,created_at').single()
    if (insErr) return NextResponse.json({ error: 'Failed to submit review.' }, { status: 500 })
    return NextResponse.json({ success: true, review })
  } catch { return NextResponse.json({ error: 'Internal error.' }, { status: 500 }) }
}

export async function DELETE(request: NextRequest) {
  const supabase = getClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await request.json()
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid review id.' }, { status: 400 })
    const { error } = await (supabase as any).from('reviews').delete().eq('id', id).eq('reviewer_id', user.id)
    if (error) return NextResponse.json({ error: 'Failed to delete.' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Internal error.' }, { status: 500 }) }
}

export async function PATCH(request: NextRequest) {
  const supabase = getClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, rating, body } = await request.json()
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid review id.' }, { status: 400 })
    const updates: Record<string,unknown> = {}
    if (rating !== undefined) { const r = parseInt(rating); if (r < 1 || r > 5) return NextResponse.json({ error: 'Rating must be 1–5.' }, { status: 400 }); updates.rating = r }
    if (body !== undefined) { const b = String(body).trim(); if (b.length < 20 || b.length > 1000) return NextResponse.json({ error: 'Review must be 20–1000 chars.' }, { status: 400 }); updates.body = b }
    const { error } = await (supabase as any).from('reviews').update(updates).eq('id', id).eq('reviewer_id', user.id)
    if (error) return NextResponse.json({ error: 'Failed to update.' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Internal error.' }, { status: 500 }) }
}
