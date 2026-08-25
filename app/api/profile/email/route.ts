export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function PUT(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { email } = await request.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    if (email.toLowerCase() === user.email?.toLowerCase())
      return NextResponse.json({ error: 'This is already your email address.' }, { status: 400 })
    const { error } = await supabase.auth.updateUser(
      { email: email.toLowerCase() },
      { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/account` }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    // Audit
    await (supabase as any).from('audit_logs').insert([{ actor_id: user.id, action: 'auth.email_change_requested', target_table: 'auth.users', target_id: user.id, metadata: { new_email_masked: email.replace(/(?<=.{2}).(?=.*@)/g,'*') } }]).catch(()=>{})
    return NextResponse.json({ success: true, message: 'Verification email sent to your new address.' })
  } catch {
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 })
  }
}
