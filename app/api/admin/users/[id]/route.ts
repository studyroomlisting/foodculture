export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_ROLES = ['visitor','owner','influencer','admin']

async function guard(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok:false, status:401, adminId:'', supabase }
  const { data: p } = await (supabase as any).from('profiles').select('role').eq('id', user.id).single()
  if (!p || p.role !== 'admin') return { ok:false, status:403, adminId:'', supabase }
  return { ok:true, status:200, adminId:user.id, supabase }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { ok, status, adminId, supabase } = await guard(request)
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status })
  const targetId = params.id
  if (!/^[0-9a-f-]{36}$/i.test(targetId))
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
  if (targetId === adminId)
    return NextResponse.json({ error: 'Cannot modify your own admin account.' }, { status: 400 })
  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {}
    const meta:    Record<string, unknown> = {}

    if (body.action === 'suspend') {
      updates.suspended_at     = new Date().toISOString()
      updates.suspended_reason = String(body.reason || '').slice(0, 300) || null
      updates.suspended_by     = adminId
      meta.action = 'suspend'; meta.reason = updates.suspended_reason
    } else if (body.action === 'activate') {
      updates.suspended_at     = null
      updates.suspended_reason = null
      updates.suspended_by     = null
      meta.action = 'activate'
    } else if (body.action === 'assign_role') {
      if (!ALLOWED_ROLES.includes(body.role))
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      updates.role = body.role
      meta.action = 'assign_role'; meta.new_role = body.role
    } else if (body.action === 'update') {
      if (body.full_name)            updates.full_name   = String(body.full_name).slice(0, 100)
      if (body.admin_notes !== undefined) updates.admin_notes = String(body.admin_notes).slice(0, 500)
      meta.action = 'update'
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { error: upErr } = await (supabase as any).from('profiles').update(updates).eq('id', targetId)
    if (upErr) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

    await (supabase as any).from('audit_logs').insert([{
      actor_id: adminId, action: `admin.user_${meta.action}`,
      target_table: 'profiles', target_id: targetId, metadata: meta,
    }]).catch(() => {})
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { ok, status, adminId, supabase } = await guard(request)
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status })
  const targetId = params.id
  if (!/^[0-9a-f-]{36}$/i.test(targetId))
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
  if (targetId === adminId)
    return NextResponse.json({ error: 'Cannot delete your own account.' }, { status: 400 })
  try {
    await (supabase as any).from('profiles')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', targetId)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      await adminClient.auth.admin.deleteUser(targetId)
    }
    await (supabase as any).from('audit_logs').insert([{
      actor_id: adminId, action: 'admin.user_deleted',
      target_table: 'profiles', target_id: targetId, metadata: {},
    }]).catch(() => {})
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
