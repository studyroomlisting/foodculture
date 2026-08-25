export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { sendNewEnquiryEmail, sendEnquiryConfirmationEmail } from '@/lib/email'

// Basic email regex (RFC 5322 simplified)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sanitiseText(str: unknown, maxLen: number): string {
  if (typeof str !== 'string') return ''
  return str.trim().slice(0, maxLen)
}

// Simple in-memory rate limiter: max 5 enquiries per IP per hour
const ipLimiter = new Map<string, { count: number; resetAt: number }>()
const MAX_PER_HOUR = 5

export async function POST(request: NextRequest) {
  try {
    // ── Rate limiting (5 enquiries per IP per hour) ─────────────────────────
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const now = Date.now()
    const entry = ipLimiter.get(ip)
    if (entry) {
      if (now < entry.resetAt) {
        if (entry.count >= MAX_PER_HOUR) {
          return NextResponse.json(
            { error: 'Too many enquiries. Please wait before sending another.' },
            { status: 429, headers: { 'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)) } }
          )
        }
        entry.count++
      } else {
        ipLimiter.set(ip, { count: 1, resetAt: now + 3600_000 })
      }
    } else {
      ipLimiter.set(ip, { count: 1, resetAt: now + 3600_000 })
    }
    // Clean up old entries periodically
    if (ipLimiter.size > 1000) {
      for (const [k, v] of ipLimiter.entries()) {
        if (now > v.resetAt) ipLimiter.delete(k)
      }
    }

    const body = await request.json()

    // ── Input validation & sanitisation ────────────────────────────────────
    const restaurant_id  = sanitiseText(body.restaurant_id, 36)
    const sender_name    = sanitiseText(body.sender_name, 100)
    const sender_email   = sanitiseText(body.sender_email, 254)
    const sender_phone   = sanitiseText(body.sender_phone, 20)
    const message        = sanitiseText(body.message, 2000)

    if (!restaurant_id || !sender_name || !sender_email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    // Validate UUID format for restaurant_id
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(restaurant_id)) {
      return NextResponse.json({ error: 'Invalid restaurant_id' }, { status: 400 })
    }
    // Validate email format
    if (!EMAIL_RE.test(sender_email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    // Prevent excessively short or empty fields
    if (sender_name.length < 2) {
      return NextResponse.json({ error: 'Name too short' }, { status: 400 })
    }
    if (message.length < 10) {
      return NextResponse.json({ error: 'Message too short' }, { status: 400 })
    }

    // ── Supabase client (anon key — RLS enforced) ───────────────────────────
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )

    // ── Verify restaurant exists and is approved ────────────────────────────
    const { data: restaurant, error: restError } = await (supabase as any)
      .from('restaurants')
      .select('id, name, owner_id, listing_status')
      .eq('id', restaurant_id)
      .eq('listing_status', 'approved')
      .single()

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // ── Insert enquiry (RLS: anyone can insert, enforced by policy) ─────────
    const { error: insertError } = await (supabase as any).from('enquiries').insert([{
      restaurant_id,
      sender_name,
      sender_email,
      sender_phone: sender_phone || null,
      message,
    }])

    if (insertError) {
      console.error('[api/enquiry] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to submit enquiry' }, { status: 500 })
    }

    // ── Send emails via service role (non-blocking) ─────────────────────────
    // CRITICAL-6 FIX: Use service role key for auth.admin calls, not anon key
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && restaurant.owner_id) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const adminClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        // Fetch owner profile
        const { data: ownerProfile } = await adminClient
          .from('profiles')
          .select('full_name')
          .eq('id', restaurant.owner_id)
          .single()

        // Fetch owner email via service role
        const { data: authData } = await adminClient.auth.admin.getUserById(restaurant.owner_id)
        const ownerEmail = authData?.user?.email

        if (ownerEmail) {
          await sendNewEnquiryEmail({
            to: ownerEmail,
            ownerName: (ownerProfile as any)?.full_name ?? 'there',
            restaurantName: restaurant.name,
            senderName: sender_name,
            senderEmail: sender_email,
            message,
          })
        }
      } catch (emailError) {
        console.error('[api/enquiry] Owner email error:', emailError)
      }
    }

    // Always send confirmation to the enquiry sender
    try {
      await sendEnquiryConfirmationEmail({
        to: sender_email,
        senderName: sender_name,
        restaurantName: restaurant.name,
      })
    } catch (emailError) {
      console.error('[api/enquiry] Confirmation email error:', emailError)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
