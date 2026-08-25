'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const C = { coral: '#E85D26', green: '#2E9E55', border: '#ede8e2', amber: '#D4860A', purple: '#7F77DD' }
const ROLES = ['visitor','owner','influencer','admin']
const ROLE_COLOR: Record<string,string> = { admin:'#dc2626', owner:C.amber, influencer:C.purple, visitor:'#888' }

export default function AdminUserDetailPage({ userId }: { userId: string }) {
  const router = useRouter()
  const [user, setUser]     = useState<any>(null)
  const [logs, setLogs]     = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)
  const [msg, setMsg]           = useState('')
  const [err, setErr]           = useState('')
  const [suspendReason, setSuspendReason] = useState('')
  const [adminNotes,    setAdminNotes]    = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function loadUser() {
    const [{ data: u }, { data: al }] = await Promise.all([
      (supabase as any).from('profiles')
        .select('id,full_name,username,role,onboarding_complete,city,country,bio,instagram_handle,suspended_at,suspended_reason,is_deleted,admin_notes,created_at')
        .eq('id', userId).single(),
      (supabase as any).from('audit_logs')
        .select('id,action,metadata,created_at')
        .eq('target_id', userId)
        .order('created_at', { ascending: false }).limit(20),
    ])
    if (u) { setUser(u); setAdminNotes(u.admin_notes || '') }
    setLogs(al ?? [])
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: me } }) => {
      if (!me) { router.push('/auth/signin'); return }
      const { data: p } = await (supabase as any).from('profiles').select('role').eq('id', me.id).single()
      if (p?.role !== 'admin') { router.push('/'); return }
      await loadUser()
      setLoading(false)
    })
  }, [userId, router])

  async function doAction(action: string, extra: Record<string,unknown> = {}) {
    setSaving(true); setMsg(''); setErr('')
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    })
    const j = await res.json()
    if (res.ok) { setMsg(`✓ ${action.replace(/_/g,' ')} completed`); await loadUser() }
    else setErr(j.error || 'Action failed')
    setSaving(false)
  }

  async function deleteUser() {
    setSaving(true)
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    if ((await res.json()).success) router.push('/admin/users')
    else { setErr('Delete failed'); setSaving(false) }
  }

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })

  if (loading) return <div style={{ fontFamily:'-apple-system,sans-serif', padding:60, textAlign:'center', color:'#aaa' }}>Loading user…</div>
  if (!user)   return <div style={{ fontFamily:'-apple-system,sans-serif', padding:60, textAlign:'center' }}>User not found. <Link href="/admin/users" style={{ color:C.coral }}>← Back</Link></div>

  const isSuspended = !!user.suspended_at

  return (
    <div style={{ fontFamily:'-apple-system,sans-serif', background:'#fafafa', minHeight:'100vh', color:'#1a1a1a' }}>
      <div style={{ background:'#1a1a1a', padding:'14px 28px', display:'flex', alignItems:'center', gap:14 }}>
        <Link href="/admin" style={{ fontSize:13, color:'#888', textDecoration:'none' }}>Admin</Link>
        <span style={{ color:'#444' }}>›</span>
        <Link href="/admin/users" style={{ fontSize:13, color:'#888', textDecoration:'none' }}>Users</Link>
        <span style={{ color:'#444' }}>›</span>
        <span style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{user.full_name || user.username || userId.slice(0,8)}</span>
      </div>

      <div style={{ maxWidth:920, margin:'0 auto', padding:'28px 24px', display:'grid', gridTemplateColumns:'1fr 300px', gap:20, alignItems:'start' }}>
        {/* LEFT */}
        <div>
          {msg && <div style={{ background:'#EAF8EE', border:'1px solid #b6e8c4', borderRadius:10, padding:'10px 16px', fontSize:13, color:C.green, marginBottom:16 }}>{msg}</div>}
          {err && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 16px', fontSize:13, color:'#dc2626', marginBottom:16 }}>{err}</div>}

          {/* Profile */}
          <section style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding:24, marginBottom:16 }}>
            <h2 style={{ fontSize:15, fontWeight:700, marginBottom:20 }}>👤 Profile details</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {[
                ['User ID',    userId.slice(0,20)+'…'],
                ['Full name',  user.full_name || '—'],
                ['Username',   user.username ? `@${user.username}` : '—'],
                ['Role',       user.role],
                ['City',       user.city || '—'],
                ['Country',    user.country || '—'],
                ['Onboarding', user.onboarding_complete ? '✅ Complete' : '⏳ Pending'],
                ['Joined',     fmt(user.created_at)],
                ['Instagram',  user.instagram_handle || '—'],
                ['Status',     isSuspended ? '🔴 Suspended' : user.is_deleted ? '⚫ Deleted' : '🟢 Active'],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:13, fontWeight: label==='Role' ? 700 : 400, color: label==='Role' ? (ROLE_COLOR[val as string]||'#1a1a1a') : '#1a1a1a' }}>{val}</div>
                </div>
              ))}
            </div>
            {user.bio && (
              <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#aaa', textTransform:'uppercase', marginBottom:4 }}>Bio</div>
                <p style={{ fontSize:13, color:'#555', margin:0, lineHeight:1.6 }}>{user.bio}</p>
              </div>
            )}
            {isSuspended && (
              <div style={{ marginTop:16, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:12 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#dc2626', marginBottom:4 }}>⚠️ Suspended since {fmt(user.suspended_at)}</div>
                <div style={{ fontSize:13, color:'#555' }}>{user.suspended_reason || 'No reason provided'}</div>
              </div>
            )}
          </section>

          {/* Audit log */}
          <section style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding:24 }}>
            <h2 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>📋 Audit log</h2>
            {logs.length === 0
              ? <div style={{ textAlign:'center', padding:24, color:'#aaa', fontSize:13 }}>No audit events found.</div>
              : logs.map(l => (
                <div key={l.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{l.action}</div>
                    {l.metadata && Object.keys(l.metadata).length > 0 && (
                      <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{JSON.stringify(l.metadata).slice(0,100)}</div>
                    )}
                  </div>
                  <div style={{ fontSize:11, color:'#aaa', flexShrink:0, marginLeft:12 }}>{fmt(l.created_at)}</div>
                </div>
              ))
            }
          </section>
        </div>

        {/* RIGHT — Actions */}
        <div>
          {/* Assign role */}
          <section style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding:20, marginBottom:14 }}>
            <h3 style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>🎭 Assign role</h3>
            {ROLES.map(r => (
              <button key={r} onClick={() => doAction('assign_role', { role: r })}
                disabled={saving || r === user.role}
                style={{ display:'block', width:'100%', marginBottom:7, background: r===user.role?'#f5f5f5':'#fff', border:`1px solid ${r===user.role?'#ddd':C.border}`, borderRadius:8, padding:'9px 14px', fontSize:13, textAlign:'left', cursor: r===user.role?'default':'pointer', color: r===user.role?'#aaa':ROLE_COLOR[r]||'#1a1a1a', fontWeight: r===user.role?400:500, opacity:saving?0.7:1, fontFamily:'inherit' }}>
                {r===user.role?'✓ ':''}{r.charAt(0).toUpperCase()+r.slice(1)}{r===user.role?' (current)':''}
              </button>
            ))}
          </section>

          {/* Suspend/Activate */}
          <section style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding:20, marginBottom:14 }}>
            <h3 style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>🚦 Account status</h3>
            {isSuspended ? (
              <button onClick={() => doAction('activate')} disabled={saving}
                style={{ width:'100%', background:C.green, color:'#fff', border:'none', borderRadius:10, padding:'10px 0', fontSize:13, fontWeight:600, cursor:'pointer', opacity:saving?0.7:1, fontFamily:'inherit' }}>
                ✅ Activate account
              </button>
            ) : (
              <>
                <textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)}
                  placeholder="Reason for suspension (optional)…" maxLength={300}
                  style={{ width:'100%', boxSizing:'border-box', border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 12px', fontSize:12, resize:'vertical', minHeight:56, fontFamily:'inherit', outline:'none', marginBottom:8 }} />
                <button onClick={() => doAction('suspend', { reason: suspendReason })} disabled={saving}
                  style={{ width:'100%', background:C.amber, color:'#fff', border:'none', borderRadius:10, padding:'10px 0', fontSize:13, fontWeight:600, cursor:'pointer', opacity:saving?0.7:1, fontFamily:'inherit' }}>
                  🔴 Suspend account
                </button>
              </>
            )}
          </section>

          {/* Admin notes */}
          <section style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding:20, marginBottom:14 }}>
            <h3 style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>📝 Admin notes</h3>
            <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
              placeholder="Internal notes (not visible to user)…" maxLength={500}
              style={{ width:'100%', boxSizing:'border-box', border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 12px', fontSize:12, resize:'vertical', minHeight:72, fontFamily:'inherit', outline:'none', marginBottom:8 }} />
            <button onClick={() => doAction('update', { admin_notes: adminNotes })} disabled={saving}
              style={{ width:'100%', background:'#f5f5f5', border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 0', fontSize:12, color:'#555', cursor:'pointer', fontFamily:'inherit' }}>
              Save notes
            </button>
          </section>

          {/* Delete */}
          <section style={{ background:'#fff', border:'1px solid #fecaca', borderRadius:16, padding:20 }}>
            <h3 style={{ fontSize:13, fontWeight:700, marginBottom:10, color:'#dc2626' }}>🗑️ Delete user</h3>
            <p style={{ fontSize:12, color:'#888', marginBottom:12, lineHeight:1.5 }}>Permanently removes this user. Their content is anonymised. This cannot be undone.</p>
            {!confirmDelete
              ? <button onClick={() => setConfirmDelete(true)} style={{ width:'100%', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'9px 0', fontSize:13, color:'#dc2626', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Delete account</button>
              : <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setConfirmDelete(false)} style={{ flex:1, background:'#fff', border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 0', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                  <button onClick={deleteUser} disabled={saving} style={{ flex:2, background:'#dc2626', color:'#fff', border:'none', borderRadius:8, padding:'9px 0', fontSize:13, fontWeight:600, cursor:'pointer', opacity:saving?0.7:1, fontFamily:'inherit' }}>
                    {saving ? 'Deleting…' : 'Confirm'}
                  </button>
                </div>
            }
          </section>
        </div>
      </div>
    </div>
  )
}
