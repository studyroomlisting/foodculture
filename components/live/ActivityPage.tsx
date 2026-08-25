'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

const C = { coral: '#E85D26', border: '#ede8e2', green: '#2E9E55' }
const SIDEBAR = [
  { href:'/account', label:'My profile' },
  { href:'/account/saved', label:'Saved content' },
  { href:'/account/activity', label:'Activity history', active:true },
  { href:'/account/notifications', label:'Notifications' },
  { href:'/account/privacy', label:'Privacy' },
  { href:'/account/security', label:'Security' },
]

const ACTION_LABELS: Record<string, string> = {
  'auth.login': '🔑 Signed in',
  'auth.logout': '👋 Signed out',
  'auth.password_reset': '🔒 Reset password',
  'auth.email_change_requested': '✉️ Email change requested',
}

export default function ActivityPage() {
  const router = useRouter()
  const [name, setName]     = useState(''); const [email, setEmail] = useState(''); const [initials, setInitials] = useState('U')
  const [tab,  setTab]      = useState<'viewed'|'reviews'|'security'>('viewed')
  const [data, setData]     = useState<any>({ recently_viewed:[], reviews:[], audit_logs:[] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/signin'); return }
      setEmail(user.email ?? '')
      const { data: p } = await (supabase as any).from('profiles').select('full_name').eq('id', user.id).single()
      setName(p?.full_name ?? ''); setInitials((p?.full_name||user.email||'U').charAt(0).toUpperCase())
      const res = await fetch('/api/activity')
      if (res.ok) setData(await res.json())
      setLoading(false)
    })
  }, [router])

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })

  return (
    <div style={{ fontFamily:'-apple-system,sans-serif', background:'#fafafa', minHeight:'100vh', color:'#1a1a1a' }}>
      <Nav />
      <div style={{ maxWidth:1040, margin:'0 auto', padding:'32px 24px', display:'grid', gridTemplateColumns:'240px 1fr', gap:22, alignItems:'start' }}>
        <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden', position:'sticky', top:80 }}>
          <div style={{ background:'linear-gradient(135deg,#1a0800,#2d1200)', padding:'24px 20px 0' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:C.coral, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, border:'3px solid rgba(255,255,255,.2)', marginBottom:'-32px' }}>{initials}</div>
          </div>
          <div style={{ padding:'40px 20px 12px' }}><div style={{ fontSize:15, fontWeight:700 }}>{name||'Your account'}</div><div style={{ fontSize:12, color:'#888' }}>{email}</div></div>
          <div style={{ borderTop:`1px solid ${C.border}`, paddingBottom:8 }}>
            {SIDEBAR.map(s => <Link key={s.href} href={s.href} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 20px', fontSize:13, fontWeight:500, color:(s as any).active?C.coral:'#555', background:(s as any).active?'#FEF9F6':'transparent', borderLeft:`2px solid ${(s as any).active?C.coral:'transparent'}`, textDecoration:'none' }}>{s.label}</Link>)}
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 20px', fontSize:13, color:'#dc2626', background:'none', border:'none', cursor:'pointer', width:'100%', fontFamily:'inherit', borderLeft:'2px solid transparent' }}>Sign out</button>
          </div>
        </div>
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:20 }}>
            {([['viewed','👁️ Recently viewed'],['reviews','⭐ My reviews'],['security','🔑 Security log']] as const).map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)} style={{ background:tab===t?C.coral:'#fff', color:tab===t?'#fff':'#666', border:`1px solid ${tab===t?C.coral:C.border}`, borderRadius:20, padding:'7px 16px', fontSize:13, fontWeight:tab===t?600:400, cursor:'pointer', fontFamily:'inherit' }}>{l}</button>
            ))}
          </div>
          {loading ? <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>Loading…</div> : (
            <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding:24 }}>
              {tab==='viewed' && (
                data.recently_viewed.length===0 ? (
                  <div style={{ textAlign:'center', padding:32, color:'#aaa' }}>
                    <div style={{ fontSize:36, marginBottom:10 }}>👁️</div>
                    <p>No recently viewed restaurants yet.</p>
                    <Link href="/restaurants" style={{ color:C.coral, textDecoration:'none', fontSize:13 }}>Browse restaurants →</Link>
                  </div>
                ) : data.recently_viewed.map((rv: any) => (
                  <div key={rv.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:14 }}>{rv.entity_type==='restaurant'?'🍽️':'✨'} {rv.entity_id.slice(0,8)}…</div>
                    <div style={{ fontSize:12, color:'#aaa' }}>{fmt(rv.viewed_at)}</div>
                  </div>
                ))
              )}
              {tab==='reviews' && (
                data.reviews.length===0 ? (
                  <div style={{ textAlign:'center', padding:32, color:'#aaa' }}>
                    <div style={{ fontSize:36, marginBottom:10 }}>⭐</div>
                    <p>You haven't written any reviews yet.</p>
                    <Link href="/restaurants" style={{ color:C.coral, textDecoration:'none', fontSize:13 }}>Find a restaurant to review →</Link>
                  </div>
                ) : data.reviews.map((rv: any) => (
                  <div key={rv.id} style={{ padding:'14px 0', borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                      <Link href={`/restaurants/${rv.restaurant?.slug}`} style={{ fontSize:14, fontWeight:700, color:'#1a1a1a', textDecoration:'none' }}>{rv.restaurant?.name ?? 'Restaurant'}</Link>
                      <div style={{ fontSize:13, color:'#F5A623' }}>{'★'.repeat(rv.rating)}{'☆'.repeat(5-rv.rating)}</div>
                    </div>
                    <p style={{ fontSize:13, color:'#555', margin:'4px 0' }}>{rv.body}</p>
                    <div style={{ fontSize:11, color:'#aaa' }}>{fmt(rv.created_at)}</div>
                  </div>
                ))
              )}
              {tab==='security' && (
                data.audit_logs.length===0 ? (
                  <div style={{ textAlign:'center', padding:32, color:'#aaa' }}>
                    <div style={{ fontSize:36, marginBottom:10 }}>🔑</div>
                    <p>No security events recorded yet.</p>
                  </div>
                ) : data.audit_logs.map((log: any) => (
                  <div key={log.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:14 }}>{ACTION_LABELS[log.action] ?? log.action}</div>
                    <div style={{ fontSize:12, color:'#aaa' }}>{fmt(log.created_at)}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
