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
  { href:'/account/saved', label:'Saved content', active:true },
  { href:'/account/activity', label:'Activity history' },
  { href:'/account/notifications', label:'Notifications' },
  { href:'/account/privacy', label:'Privacy' },
  { href:'/account/security', label:'Security' },
]

export default function SavedContentPage() {
  const router  = useRouter()
  const [tab,   setTab]         = useState<'restaurants'|'searches'>('restaurants')
  const [name,  setName]        = useState(''); const [email, setEmail] = useState(''); const [initials, setInitials] = useState('U')
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [searches, setSearches]       = useState<any[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/signin'); return }
      setEmail(user.email ?? '')
      const { data: p } = await (supabase as any).from('profiles').select('full_name').eq('id', user.id).single()
      setName(p?.full_name ?? ''); setInitials((p?.full_name||user.email||'U').charAt(0).toUpperCase())
      const res = await fetch('/api/favourites')
      if (res.ok) { const j = await res.json(); setRestaurants(j.restaurants ?? []); setSearches(j.searches ?? []) }
      setLoading(false)
    })
  }, [router])

  async function removeRestaurant(restaurant_id: string) {
    await fetch('/api/favourites', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'restaurant', restaurant_id }) })
    setRestaurants(prev => prev.filter(r => r.restaurant_id !== restaurant_id))
  }

  async function removeSearch(id: string) {
    await fetch('/api/favourites', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'search', id }) })
    setSearches(prev => prev.filter(s => s.id !== id))
  }

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
            {([['restaurants',`❤️ Restaurants (${restaurants.length})`],['searches',`🔍 Saved searches (${searches.length})`]] as const).map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)} style={{ background:tab===t?C.coral:'#fff', color:tab===t?'#fff':'#666', border:`1px solid ${tab===t?C.coral:C.border}`, borderRadius:20, padding:'7px 18px', fontSize:13, fontWeight:tab===t?600:400, cursor:'pointer', fontFamily:'inherit' }}>{l}</button>
            ))}
          </div>
          {loading ? <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>Loading…</div> : (
            <>
              {tab==='restaurants' && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
                  {restaurants.length===0 ? (
                    <div style={{ gridColumn:'1/-1', textAlign:'center', padding:40, color:'#aaa' }}>
                      <div style={{ fontSize:40, marginBottom:12 }}>❤️</div>
                      <div style={{ fontSize:15, fontWeight:600, marginBottom:8 }}>No saved restaurants yet</div>
                      <Link href="/restaurants" style={{ color:C.coral, textDecoration:'none', fontSize:13 }}>Browse restaurants →</Link>
                    </div>
                  ) : restaurants.map(r => {
                    const rest = r.restaurant
                    if (!rest || rest.listing_status !== 'approved') return null
                    return (
                      <div key={r.id} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
                        <div style={{ height:100, background:'#FEF0EA', display:'flex', alignItems:'center', justifyContent:'center', fontSize:44 }}>{rest.emoji}</div>
                        <div style={{ padding:'12px 14px' }}>
                          <div style={{ fontSize:14, fontWeight:700, marginBottom:2 }}>{rest.name}</div>
                          <div style={{ fontSize:12, color:'#888', marginBottom:8 }}>📍 {rest.area_label}</div>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <Link href={`/restaurants/${rest.slug}`} style={{ fontSize:12, color:C.coral, textDecoration:'none', fontWeight:600 }}>View →</Link>
                            <button onClick={() => removeRestaurant(r.restaurant_id)} style={{ background:'#fef2f2', border:'none', borderRadius:8, padding:'4px 10px', fontSize:11, color:'#dc2626', cursor:'pointer' }}>Remove</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {tab==='searches' && (
                <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
                  {searches.length===0 ? (
                    <div style={{ textAlign:'center', padding:32, color:'#aaa' }}>
                      <div style={{ fontSize:36, marginBottom:10 }}>🔍</div>
                      <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>No saved searches yet</div>
                      <Link href="/explore" style={{ color:C.coral, textDecoration:'none', fontSize:13 }}>Try exploring →</Link>
                    </div>
                  ) : searches.map(s => (
                    <div key={s.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:600 }}>🔍 {s.query}</div>
                        <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>{new Date(s.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</div>
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <Link href={`/restaurants?q=${encodeURIComponent(s.query)}`} style={{ background:'#FEF0EA', border:'none', borderRadius:8, padding:'5px 12px', fontSize:12, color:C.coral, fontWeight:600, textDecoration:'none' }}>Search</Link>
                        <button onClick={() => removeSearch(s.id)} style={{ background:'#fef2f2', border:'none', borderRadius:8, padding:'5px 10px', fontSize:12, color:'#dc2626', cursor:'pointer' }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
