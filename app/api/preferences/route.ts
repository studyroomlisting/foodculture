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
  const { data } = await (supabase as any).from('profiles').select(
    'preferred_cuisines,dietary_preferences,preferred_zone_ids,favourite_restaurant_ids,favourite_influencer_ids,notification_prefs,preferred_search_radius'
  ).eq('id', user.id).single()
  return NextResponse.json({ data: data ?? {} })
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {}
    if (Array.isArray(body.preferred_cuisines))
      updates.preferred_cuisines = body.preferred_cuisines.map((c: string) => String(c).slice(0,50)).slice(0,20)
    if (Array.isArray(body.dietary_preferences))
      updates.dietary_preferences = body.dietary_preferences.map((d: string) => String(d).slice(0,50)).slice(0,10)
    if (Array.isArray(body.preferred_zone_ids))
      updates.preferred_zone_ids = body.preferred_zone_ids.slice(0,10)
    if (typeof body.notification_prefs === 'object' && body.notification_prefs !== null)
      updates.notification_prefs = body.notification_prefs
    if (typeof body.preferred_search_radius === 'number') {
      const r = Math.max(1, Math.min(50, Math.round(body.preferred_search_radius)))
      updates.preferred_search_radius = r
    }
    const { error } = await (supabase as any).from('profiles').update(updates).eq('id', user.id)
    if (error) return NextResponse.json({ error: 'Failed to save preferences.' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
}
