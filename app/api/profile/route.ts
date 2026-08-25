export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ALLOWED_GENDERS    = ['male','female','non_binary','prefer_not_to_say']
const ALLOWED_LANGUAGES  = ['en','hi','kn','ta','te','ml']
const ALLOWED_AUDIENCE   = ['micro','mid','macro','mega']

function san(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim().slice(0, max)
  return t || null
}

export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await (supabase as any).from('profiles').select('*').eq('id', user.id).single()
  if (error) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PUT(request: NextRequest) {
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
    if (body.full_name      !== undefined) updates.full_name      = san(body.full_name, 100)
    if (body.username       !== undefined) {
      const u = san(body.username, 30)?.toLowerCase().replace(/[^a-z0-9_]/g,'')
      if (u && u.length < 3) return NextResponse.json({ error: 'Username must be at least 3 characters.' }, { status: 400 })
      updates.username = u
    }
    if (body.bio            !== undefined) updates.bio            = san(body.bio, 500)
    if (body.phone          !== undefined) updates.phone          = san(body.phone, 20)
    if (body.city           !== undefined) updates.city           = san(body.city, 100)
    if (body.state          !== undefined) updates.state          = san(body.state, 100)
    if (body.country        !== undefined) updates.country        = san(body.country, 100)
    if (body.preferred_language !== undefined && ALLOWED_LANGUAGES.includes(body.preferred_language))
      updates.preferred_language = body.preferred_language
    if (body.gender         !== undefined && ALLOWED_GENDERS.includes(body.gender))
      updates.gender = body.gender
    if (body.date_of_birth  !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(body.date_of_birth))
      updates.date_of_birth = body.date_of_birth
    if (body.preferred_search_radius !== undefined) {
      const r = parseInt(body.preferred_search_radius)
      if (!isNaN(r) && r >= 1 && r <= 50) updates.preferred_search_radius = r
    }
    if (body.instagram_handle !== undefined) updates.instagram_handle = san(body.instagram_handle, 50)
    if (body.influencer_youtube !== undefined) updates.influencer_youtube = san(body.influencer_youtube, 100)
    if (body.audience_size_range !== undefined && ALLOWED_AUDIENCE.includes(body.audience_size_range))
      updates.audience_size_range = body.audience_size_range
    if (body.content_types  !== undefined && Array.isArray(body.content_types))
      updates.content_types = body.content_types.map((t: string) => String(t).slice(0,50)).slice(0,10)

    const { error } = await (supabase as any).from('profiles').update(updates).eq('id', user.id)
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Username already taken.' }, { status: 409 })
      return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
}
