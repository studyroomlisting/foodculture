'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const C = { coral: '#E85D26', green: '#2E9E55', border: '#ede8e2', amber: '#D4860A', purple: '#7F77DD' }

const ROLES = ['visitor','owner','influencer','admin'] as const
type Role = typeof ROLES[number]

const PERMISSIONS: { group: string; key: string; label: string; roles: Role[] }[] = [
  { group:'Discovery',       key:'view_restaurants',     label:'View approved restaurants',         roles:['visitor','owner','influencer','admin'] },
  { group:'Discovery',       key:'view_influencers',     label:'View influencer directory',          roles:['visitor','owner','influencer','admin'] },
  { group:'Discovery',       key:'view_deals',           label:'View active deals',                  roles:['visitor','owner','influencer','admin'] },
  { group:'Discovery',       key:'search_restaurants',   label:'Search & filter restaurants',        roles:['visitor','owner','influencer','admin'] },
  { group:'Engagement',      key:'write_review',         label:'Write restaurant reviews',           roles:['visitor','owner','influencer','admin'] },
  { group:'Engagement',      key:'save_restaurant',      label:'Save / bookmark restaurants',        roles:['visitor','owner','influencer','admin'] },
  { group:'Engagement',      key:'send_enquiry',         label:'Send restaurant enquiry',            roles:['visitor','owner','influencer','admin'] },
  { group:'Engagement',      key:'connect_influencer',   label:'Send influencer connection request', roles:['owner','admin'] },
  { group:'Restaurant Owner',key:'create_listing',       label:'Create restaurant listing',          roles:['owner','admin'] },
  { group:'Restaurant Owner',key:'edit_own_listing',     label:'Edit own listing (not status)',      roles:['owner','admin'] },
  { group:'Restaurant Owner',key:'submit_listing',       label:'Submit listing for admin review',    roles:['owner','admin'] },
  { group:'Restaurant Owner',key:'view_enquiries',       label:'View own restaurant enquiries',      roles:['owner','admin'] },
  { group:'Restaurant Owner',key:'owner_dashboard',      label:'Access owner dashboard',             roles:['owner','admin'] },
  { group:'Influencer',      key:'influencer_dashboard', label:'Access influencer dashboard',        roles:['influencer','admin'] },
  { group:'Influencer',      key:'collab_requests',      label:'View collaboration requests',        roles:['influencer','admin'] },
  { group:'Influencer',      key:'public_creator_profile',label:'Manage public creator profile',    roles:['influencer','admin'] },
  { group:'Admin',           key:'admin_dashboard',      label:'Access admin dashboard',             roles:['admin'] },
  { group:'Admin',           key:'approve_listings',     label:'Approve / reject listings',          roles:['admin'] },
  { group:'Admin',           key:'manage_users',         label:'Create / suspend / delete users',    roles:['admin'] },
  { group:'Admin',           key:'assign_roles',         label:'Assign user roles',                  roles:['admin'] },
  { group:'Admin',           key:'view_all_audit_logs',  label:'View all audit logs',                roles:['admin'] },
  { group:'Admin',           key:'delete_reviews',       label:'Delete any review',                  roles:['admin'] },
  { group:'Admin',           key:'manage_claims',        label:'Approve ownership claims',           roles:['admin'] },
]

const ROLE_COLOR: Record<Role, string> = {
  admin: '#dc2626', owner: C.amber, influencer: C.purple, visitor: '#888'
}

export default function AdminPermissionsPage() {
  const router  = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/signin'); return }
      const { data: p } = await (supabase as any).from('profiles').select('role').eq('id', user.id).single()
      if (p?.role !== 'admin') { router.push('/'); return }
      setReady(true)
    })
  }, [router])

  if (!ready) return <div style={{ fontFamily:'-apple-system,sans-serif', padding:60, textAlign:'center', color:'#aaa' }}>Loading…</div>

  const groups = [...new Set(PERMISSIONS.map(p => p.group))]

  return (
    <div style={{ fontFamily:'-apple-system,sans-serif', background:'#fafafa', minHeight:'100vh', color:'#1a1a1a' }}>
      {/* Nav */}
      <div style={{ background:'#1a1a1a', padding:'14px 28px', display:'flex', alignItems:'center', gap:14 }}>
        <Link href="/admin" style={{ fontSize:13, color:'#888', textDecoration:'none' }}>Admin</Link>
        <span style={{ color:'#444' }}>›</span>
        <span style={{ fontSize:14, fontWeight:600, color:'#fff' }}>🔐 Permissions Matrix</span>
      </div>

      <div style={{ maxWidth:980, margin:'0 auto', padding:'28px 24px' }}>
        <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 18px', marginBottom:20, fontSize:13, color:'#555' }}>
          ℹ️ This matrix documents what each role can do. Permissions are enforced by Supabase Row Level Security policies and API middleware — they are not editable here.
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          {ROLES.map(r => (
            <div key={r} style={{ display:'flex', alignItems:'center', gap:6, background:'#fff', border:`1px solid ${C.border}`, borderRadius:20, padding:'5px 14px', fontSize:12 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:ROLE_COLOR[r] }} />
              <span style={{ fontWeight:600, color:ROLE_COLOR[r], textTransform:'capitalize' }}>{r}</span>
            </div>
          ))}
        </div>

        {/* Matrix */}
        <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden', marginBottom:20 }}>
          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr repeat(4,90px)', background:'#f8f8f8', borderBottom:`1px solid ${C.border}`, padding:'12px 20px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px' }}>Permission</div>
            {ROLES.map(r => (
              <div key={r} style={{ fontSize:12, fontWeight:700, color:ROLE_COLOR[r], textAlign:'center', textTransform:'capitalize' }}>{r}</div>
            ))}
          </div>

          {groups.map(group => (
            <div key={group}>
              <div style={{ background:'#fafafa', borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:'6px 20px', fontSize:10, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px' }}>
                {group}
              </div>
              {PERMISSIONS.filter(p => p.group === group).map((perm, i, arr) => (
                <div key={perm.key}
                  style={{ display:'grid', gridTemplateColumns:'1fr repeat(4,90px)', padding:'11px 20px', borderBottom: i < arr.length-1 ? `1px solid ${C.border}` : 'none', alignItems:'center' }}>
                  <div style={{ fontSize:13, color:'#555' }}>{perm.label}</div>
                  {ROLES.map(r => (
                    <div key={r} style={{ textAlign:'center', fontSize:16 }}>
                      {perm.roles.includes(r)
                        ? <span style={{ color:C.green }}>✓</span>
                        : <span style={{ color:'#e5e7eb' }}>—</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Security enforcement */}
        <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding:24 }}>
          <h3 style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>🔒 How permissions are enforced</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { layer:'Supabase RLS Policies',     file:'migration_003_security.sql',     desc:'Row-level security on every table. No DB query can bypass these policies.' },
              { layer:'Next.js Middleware',         file:'middleware.ts',                  desc:'Rate limiting, session validation, admin role check from DB on every request.' },
              { layer:'API Route Guards',           file:'app/api/admin/*/route.ts',       desc:'Every admin API independently verifies the caller\'s role before executing.' },
              { layer:'UI Route Guards',            file:'middleware.ts ADMIN_ROUTES',     desc:'Admin pages redirect non-admins to homepage before any component renders.' },
            ].map(row => (
              <div key={row.layer} style={{ background:'#fafafa', border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>{row.layer}</div>
                <div style={{ fontSize:11, color:C.coral, fontFamily:'monospace', marginBottom:8, wordBreak:'break-all' }}>{row.file}</div>
                <div style={{ fontSize:12, color:'#888', lineHeight:1.5 }}>{row.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
