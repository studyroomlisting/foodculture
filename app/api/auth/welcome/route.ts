export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { sendWelcomeEmail, sendListingSubmittedEmail } from '@/lib/email'

const ALLOWED_TYPES = ['welcome', 'listing_submitted'] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    // Validate type
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Sanitise data fields — email always comes from verified session, not user input
    const name = typeof data?.name === 'string' ? data.name.slice(0, 100) : ''
    const role = typeof data?.role === 'string' ? data.role.slice(0, 20) : 'visitor'
    const restaurantName = typeof data?.restaurantName === 'string' ? data.restaurantName.slice(0, 200) : ''

    if (type === 'welcome') {
      await sendWelcomeEmail({ to: user.email, name, role })
    } else if (type === 'listing_submitted') {
      if (!restaurantName) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
      await sendListingSubmittedEmail({ to: user.email, name, restaurantName })
    }

    return NextResponse.json({ success: true })
  } catch {
    // WELCOME-1 FIX: Generic error only — never expose err.message
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
