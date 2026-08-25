export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { reason } = await request.json()
    const safeReason = typeof reason === 'string' ? reason.slice(0, 300) : null
    await (supabase as any).from('profiles').update({ deactivated_at: new Date().toISOString(), deactivation_reason: safeReason }).eq('id', user.id)
    // Best-effort audit log — PostgrestBuilder isn't a real Promise (no .catch()),
    // so wrap in try/catch instead of chaining .catch() directly on it.
    try {
      await (supabase as any).from('audit_logs').insert([{ actor_id: user.id, action: 'account.deactivated', target_table: 'profiles', target_id: user.id, metadata: { reason: safeReason } }])
    } catch {}
    await supabase.auth.signOut()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 })
  }
}
