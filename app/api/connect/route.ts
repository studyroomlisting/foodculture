export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { sendConnectionRequestEmail } from '@/lib/email'

function sanitiseText(str: unknown, maxLen: number): string {
  if (typeof str !== 'string') return ''
  return str.trim().slice(0, maxLen)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const influencer_id    = sanitiseText(body.influencer_id, 36)
    const restaurant_name  = sanitiseText(body.restaurant_name, 200)
    const requester_name   = sanitiseText(body.requester_name, 100)
    const collab_interest  = sanitiseText(body.collab_interest, 500)

    // Input validation
    if (!influencer_id || !restaurant_name || !requester_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(influencer_id)) {
      return NextResponse.json({ error: 'Invalid influencer_id' }, { status: 400 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )

    // HIGH-3 FIX: Require authentication for connection requests
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required to connect with influencers' }, { status: 401 })
    }

    // Verify influencer exists
    const { data: influencer } = await (supabase as any)
      .from('influencers')
      .select('id, name')
      .eq('id', influencer_id)
      .single()

    if (!influencer) {
      return NextResponse.json({ error: 'Influencer not found' }, { status: 404 })
    }

    const { error: insertError } = await (supabase as any)
      .from('connection_requests')
      .insert([{ influencer_id, restaurant_name, requester_name, collab_interest: collab_interest || null }])

    if (insertError) {
      console.error('[api/connect] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to submit connection request' }, { status: 500 })
    }

    // Non-blocking email notification
    try {
      if (process.env.INFLUENCER_NOTIFY_EMAIL) {
        await sendConnectionRequestEmail({
          to: process.env.INFLUENCER_NOTIFY_EMAIL,
          influencerName: influencer.name,
          restaurantName: restaurant_name,
          requesterName: requester_name,
        })
      }
    } catch (emailError) {
      console.error('[api/connect] Email error:', emailError)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
