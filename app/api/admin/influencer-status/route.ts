export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Mirrors app/api/admin/listing-status/route.ts (restaurants) — same
// whitelist-status, verify-admin-from-DB, don't-leak-internal-errors shape.
const ALLOWED_STATUSES = ['approved', 'rejected'] as const
type AllowedStatus = typeof ALLOWED_STATUSES[number]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { influencer_id, status, rejection_reason } = body

    if (!influencer_id || typeof influencer_id !== 'string') {
      return NextResponse.json({ error: 'Invalid influencer_id' }, { status: 400 })
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(influencer_id)) {
      return NextResponse.json({ error: 'Invalid influencer_id format' }, { status: 400 })
    }
    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` }, { status: 400 })
    }
    const safeRejectionReason = rejection_reason ? String(rejection_reason).slice(0, 500) : undefined

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: existing, error: existingErr } = await (supabase as any)
      .from('influencers').select('id, name, listing_status').eq('id', influencer_id).single()
    if (existingErr || !existing) return NextResponse.json({ error: 'Influencer not found' }, { status: 404 })

    const updatePayload: Record<string, unknown> = { listing_status: status as AllowedStatus }
    if (status === 'approved') {
      updatePayload.approved_at = new Date().toISOString()
      updatePayload.rejection_reason = null
    }
    if (safeRejectionReason) updatePayload.rejection_reason = safeRejectionReason

    const { error: updateError } = await (supabase as any)
      .from('influencers').update(updatePayload).eq('id', influencer_id)
    if (updateError) {
      console.error('[admin/influencer-status] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update influencer' }, { status: 500 })
    }

    try {
      await (supabase as any).from('audit_logs').insert([{
        actor_id: user.id,
        action: `influencer.${status}`,
        target_table: 'influencers',
        target_id: influencer_id,
        metadata: { influencer_name: existing.name, previous_status: existing.listing_status, new_status: status, rejection_reason: safeRejectionReason ?? null },
      }])
    } catch {}

    return NextResponse.json({ success: true, status })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
