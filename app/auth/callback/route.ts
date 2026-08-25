import { createServerClient } from '@supabase/ssr'
import { sendWelcomeEmail } from '@/lib/email'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // C-2 FIX: Validate next is a relative path — prevent open redirect
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/signin?error=code_missing`)
  }

  const response = NextResponse.redirect(`${origin}${next}`)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    }
  )

  const { data: session, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !session?.user) {
    return NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`)
  }

  // Handle email change confirmation — redirect to account with success message
  const type = searchParams.get('type')
  if (type === 'email_change') {
    const response = NextResponse.redirect(`${origin}/account?email_updated=1`)
    await (supabase as any).from('audit_logs').insert([{
      actor_id: session.user.id,
      action: 'auth.email_changed',
      target_table: 'auth.users',
      target_id: session.user.id,
      metadata: { new_email: session.user.email },
    }]).catch(() => {})
    return response
  }

  const userId   = session.user.id
  const provider = session.user.app_metadata?.provider ?? 'email'
  const createdAt = session.user.created_at ? new Date(session.user.created_at).getTime() : 0
  const isNewUser = (Date.now() - createdAt) < 30_000   // < 30 seconds = brand new

  // ── For Google OAuth new users: apply role from URL param ────────────────
  const urlRole = searchParams.get('role')
  const allowedRoles = ['visitor','owner','influencer']
  if (isNewUser && urlRole && allowedRoles.includes(urlRole)) {
    await (supabase as any)
      .from('profiles')
      .update({ role: urlRole, onboarding_role: urlRole })
      .eq('id', userId)
      .catch(() => {})
  }

  // ── Audit log: register or login ──────────────────────────────────────────
  const action = isNewUser ? 'auth.register' : 'auth.login'
  await (supabase as any).from('audit_logs').insert([{
    actor_id:    userId,
    action,
    target_table:'auth.users',
    target_id:   userId,
    metadata:    { provider, is_new_user: isNewUser },
  }]).catch(() => {})

  // ── Reset failed login count on successful login ───────────────────────────
  await (supabase as any).from('profiles')
    .update({ failed_login_count: 0, locked_at: null })
    .eq('id', userId)
    .catch(() => {})

  // ── Send welcome email to new users (non-blocking) ───────────────────────
  if (isNewUser && session.user.email) {
    const { data: pData } = await (supabase as any)
      .from('profiles')
      .select('full_name,role')
      .eq('id', userId)
      .single()
    await sendWelcomeEmail({
      to:   session.user.email,
      name: pData?.full_name ?? '',
      role: pData?.role      ?? 'visitor',
    }).catch(() => {})
  }

  return response
}
