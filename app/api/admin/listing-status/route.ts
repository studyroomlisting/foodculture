export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { sendListingApprovedEmail, sendListingRejectedEmail } from '@/lib/email'

// CRITICAL-5 FIX: Strict whitelist — no arbitrary status values accepted
const ALLOWED_STATUSES = ['approved', 'rejected', 'suspended', 'archived'] as const
type AllowedStatus = typeof ALLOWED_STATUSES[number]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listing_id, status, name, rejection_reason } = body

    // ── Input validation ────────────────────────────────────────────────────
    if (!listing_id || typeof listing_id !== 'string') {
      return NextResponse.json({ error: 'Invalid listing_id' }, { status: 400 })
    }
    // Validate listing_id is a valid UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(listing_id)) {
      return NextResponse.json({ error: 'Invalid listing_id format' }, { status: 400 })
    }
    // CRITICAL-5 FIX: Whitelist validation — reject any unlisted status value
    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }
    if (status === 'rejected' && rejection_reason && typeof rejection_reason !== 'string') {
      return NextResponse.json({ error: 'Invalid rejection_reason' }, { status: 400 })
    }
    // Sanitise rejection_reason length
    const safeRejectionReason = rejection_reason
      ? String(rejection_reason).slice(0, 500)
      : undefined

    // ── Auth: verify caller is admin ────────────────────────────────────────
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role from database (never from cookie/header)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      // Generic error — do not reveal whether user exists or has wrong role
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Verify listing exists before updating ───────────────────────────────
    const { data: existingListing, error: listingError } = await (supabase as any)
      .from('restaurants')
      .select('id, name, listing_status')
      .eq('id', listing_id)
      .single()

    if (listingError || !existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // ── Update listing status ───────────────────────────────────────────────
    const updatePayload: Record<string, unknown> = { listing_status: status as AllowedStatus }
    if (status === 'approved') {
      updatePayload.approved_at = new Date().toISOString()
      updatePayload.rejection_reason = null  // clear previous rejection reason
    }
    if (safeRejectionReason) {
      updatePayload.rejection_reason = safeRejectionReason
    }

    const { error: updateError } = await (supabase as any)
      .from('restaurants')
      .update(updatePayload)
      .eq('id', listing_id)

    if (updateError) {
      // CRITICAL: Do not leak internal DB error messages
      console.error('[admin/listing-status] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
    }

    // ── Write audit log ─────────────────────────────────────────────────────
    await (supabase as any).from('audit_logs').insert([{
      actor_id: user.id,
      action: `listing.${status}`,
      target_table: 'restaurants',
      target_id: listing_id,
      metadata: {
        restaurant_name: existingListing.name,
        previous_status: existingListing.listing_status,
        new_status: status,
        rejection_reason: safeRejectionReason ?? null,
      },
    }])

    // ── Send email notification (non-blocking, requires service role key) ───
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const adminClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        const { data: rest } = await (supabase as any)
          .from('restaurants')
          .select('slug, owner_id, profiles(full_name)')
          .eq('id', listing_id)
          .single()

        if (rest?.owner_id) {
          const { data: authData } = await adminClient.auth.admin.getUserById(rest.owner_id)
          const ownerEmail = authData?.user?.email
          if (ownerEmail) {
            const ownerName = rest.profiles?.full_name ?? ''
            const restaurantName = rest.name ?? existingListing.name
            if (status === 'approved') {
              await sendListingApprovedEmail({ to: ownerEmail, name: ownerName, restaurantName, restaurantSlug: rest.slug })
            } else if (status === 'rejected') {
              await sendListingRejectedEmail({ to: ownerEmail, name: ownerName, restaurantName, reason: safeRejectionReason })
            }
          }
        }
      } catch (emailError) {
        // Non-fatal — log but do not surface to client
        console.error('[admin/listing-status] Email error:', emailError)
      }
    }

    return NextResponse.json({ success: true, status })
  } catch {
    // CRITICAL: Generic error — never surface internal details to client
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
