'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

const C = { coral: '#E85D26', border: '#ede8e2', green: '#2E9E55' }

const SIDEBAR = [
  { href:'/account',               label:'My profile'       },
  { href:'/account/saved',         label:'Saved content'    },
  { href:'/account/activity',      label:'Activity history' },
  { href:'/account/notifications', label:'Notifications'    },
  { href:'/account/privacy',       label:'Privacy', active: true },
  { href:'/account/security',      label:'Security'         },
]

function Toggle({ on, onToggle, id }: { on: boolean; onToggle: () => void; id: string }) {
  return (
    <button type="button" id={id} role="switch" aria-checked={on} onClick={onToggle}
      style={{ width:44, height:24, borderRadius:12, background:on?C.coral:'#e0e0e0', border:'none', cursor:'pointer', position:'relative', flexShrink:0, transition:'background .2s' }}>
      <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:on?23:3, transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.2)' }} />
    </button>
  )
}

export default function PrivacySettingsPage() {
  const router = useRouter()
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [initials, setInitials] = useState('U')
  const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false)
  const [prefs, setPrefs] = useState({ profile_public:true, show_email:false, show_phone:false, allow_dm:true })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/signin'); return }
      setEmail(user.email ?? '')
      const { data: p } = await (supabase as any).from('profiles').select('full_name,profile_public,show_email,show_phone,allow_dm').eq('id', user.id).single()
      if (p) { setName(p.full_name ?? ''); setInitials((p.full_name||user.email||'U').charAt(0).toUpperCase()); setPrefs({ profile_public:p.profile_public??true, show_email:p.show_email??false, show_phone:p.show_phone??false, allow_dm:p.allow_dm??true }) }
    })
  }, [router])

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await (supabase as any).from('profiles').update(prefs).eq('id', user.id)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const rows: [keyof typeof prefs, string, string][] = [
    ['profile_public', 'Public profile', 'Allow anyone to view your profile page at foodculture.ai/u/username'],
    ['show_email',     'Show email',     'Display your email address on your public profile'],
    ['show_phone',     'Show phone',     'Display your phone number on your public profile'],
    ['allow_dm',       'Allow messages', 'Let restaurants and influencers send you direct messages'],
  ]

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
          <section style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding:24, marginBottom:16 }}>
            <h2 style={{ fontSize:15, fontWeight:700, marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>🔒 Privacy settings</h2>
            <p style={{ fontSize:13, color:'#888', marginBottom:20 }}>Control who can see your information and how others can interact with you.</p>
            {rows.map(([key, label, sub]) => (
              <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:`1px solid ${C.border}` }}>
                <div><div style={{ fontSize:14, fontWeight:600 }}>{label}</div><div style={{ fontSize:12, color:'#888', marginTop:2 }}>{sub}</div></div>
                <Toggle id={`priv-${key}`} on={prefs[key]} onToggle={() => setPrefs(p => ({ ...p, [key]: !p[key] }))} />
              </div>
            ))}
            <div style={{ paddingTop:20, display:'flex', alignItems:'center', gap:12 }}>
              <button onClick={save} disabled={saving} style={{ background:C.coral, border:'none', borderRadius:10, padding:'10px 24px', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', opacity:saving?0.7:1 }}>{saving?'Saving…':'Save settings'}</button>
              {saved && <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>✓ Saved</span>}
            </div>
          </section>
          <section style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding:24 }}>
            <h2 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>📋 Data & account</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'Download your data', sub:'Request a copy of all your FoodCulture AI data', action:'Request download', style:{ background:'#f5f5f5', border:'none', borderRadius:10, padding:'8px 18px', fontSize:13, cursor:'pointer' } },
                { label:'Delete account', sub:'Permanently remove your account and all personal data', action:'Delete account', href:'/account/delete', style:{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'8px 18px', fontSize:13, color:'#dc2626', cursor:'pointer' } },
              ].map(row => (
                <div key={row.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
                  <div><div style={{ fontSize:14, fontWeight:600 }}>{row.label}</div><div style={{ fontSize:12, color:'#888', marginTop:2 }}>{row.sub}</div></div>
                  {row.href ? <Link href={row.href} style={{ ...row.style, textDecoration:'none', display:'inline-block' }}>{row.action}</Link>
                    : <button style={row.style as any}>{row.action}</button>}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  )
}
