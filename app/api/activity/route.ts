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
  const [{ data: recentlyViewed }, { data: reviews }, { data: auditLogs }] = await Promise.all([
    (supabase as any).from('recently_viewed').select('id,entity_type,entity_id,viewed_at').eq('user_id', user.id).order('viewed_at', { ascending: false }).limit(20),
    (supabase as any).from('reviews').select('id,restaurant_id,rating,body,created_at,restaurant:restaurants(id,slug,name,emoji)').eq('reviewer_id', user.id).order('created_at', { ascending: false }).limit(20),
    (supabase as any).from('audit_logs').select('id,action,metadata,created_at').eq('actor_id', user.id).in('action', ['auth.login','auth.logout','auth.password_reset']).order('created_at', { ascending: false }).limit(10),
  ])
  return NextResponse.json({ recently_viewed: recentlyViewed ?? [], reviews: reviews ?? [], audit_logs: auditLogs ?? [] })
}

// POST — record a view
export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: true }) // silent for anon
  try {
    const { entity_type, entity_id } = await request.json()
    if (!['restaurant','influencer'].includes(entity_type)) return NextResponse.json({ ok: true })
    if (!/^[0-9a-f-]{36}$/i.test(entity_id)) return NextResponse.json({ ok: true })
    await (supabase as any).from('recently_viewed').upsert([
      { user_id: user.id, entity_type, entity_id, viewed_at: new Date().toISOString() }
    ], { onConflict: 'user_id,entity_type,entity_id' })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
