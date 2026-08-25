export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_ROLES = ['visitor','owner','influencer','admin']

async function getAdmin(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok:false, status:401, msg:'Unauthorized', adminId:'', supabase }
  const { data: p } = await (supabase as any).from('profiles').select('role').eq('id', user.id).single()
  if (!p || p.role !== 'admin') return { ok:false, status:403, msg:'Forbidden', adminId:'', supabase }
  return { ok:true, status:200, msg:'', adminId:user.id, supabase }
}

export async function GET(request: NextRequest) {
  const { ok, status, msg, supabase } = await getAdmin(request)
  if (!ok) return NextResponse.json({ error: msg }, { status })
  const url    = new URL(request.url)
  const role   = url.searchParams.get('role')   || ''
  const search = url.searchParams.get('search') || ''
  const filter = url.searchParams.get('status') || 'all'
  const limit  = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
  const offset = parseInt(url.searchParams.get('offset') || '0')

  let q = (supabase as any)
    .from('profiles')
    .select('id,full_name,username,role,onboarding_complete,onboarding_role,city,instagram_handle,suspended_at,suspended_reason,is_deleted,admin_notes,created_at', { count: 'exact' })
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (role)             q = q.eq('role', role)
  if (search)           q = q.or(`full_name.ilike.%${search}%,username.ilike.%${search}%`)
  if (filter === 'suspended') q = q.not('suspended_at', 'is', null)
  if (filter === 'active')    q = q.is('suspended_at', null)

  const { data, count, error } = await q
  if (error) return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  return NextResponse.json({ data: data ?? [], count: count ?? 0 })
}

export async function POST(request: NextRequest) {
  const { ok, status, msg, adminId, supabase } = await getAdmin(request)
  if (!ok) return NextResponse.json({ error: msg }, { status })
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 503 })
  try {
    const body = await request.json()
    const email = String(body.email || '').toLowerCase().trim()
    const role  = ALLOWED_ROLES.includes(body.role) ? body.role : 'visitor'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { role, full_name: body.full_name || email.split('@')[0] },
    })
    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 })

    await (supabase as any).from('audit_logs').insert([{
      actor_id: adminId, action: 'admin.user_created',
      target_table: 'profiles', target_id: newUser.user?.id,
      metadata: { email, role },
    }]).catch(() => {})
    return NextResponse.json({ success: true, user_id: newUser.user?.id })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
