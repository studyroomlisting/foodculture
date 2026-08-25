'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

const C = { coral: '#E85D26', gold: '#F5A623', green: '#2E9E55', border: '#ede8e2' }

export default function TrendingPage() {
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [influencers, setInfluencers]  = useState<any[]>([])
  const [loading, setLoading]          = useState(true)
  const [tab, setTab]                  = useState<'restaurants'|'influencers'>('restaurants')

  useEffect(() => {
    Promise.all([
      (supabase as any).from('restaurants').select('id,slug,name,emoji,area_label,price_tier,rating,intelligence_score,cuisine_tags,ai_brief').eq('listing_status','approved').order('intelligence_score',{ascending:false}).limit(12),
      (supabase as any).from('influencers').select('id,slug,name,handle,followers_count,impact_score,engagement_rate,visits_driven_weekly').order('impact_score',{ascending:false}).limit(8),
    ]).then(([r, i]) => {
      setRestaurants(r.data ?? [])
      setInfluencers(i.data ?? [])
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ fontFamily:'-apple-system,sans-serif', background:'#fafafa', minHeight:'100vh' }}>
      <Nav />
      <div style={{ background:'linear-gradient(135deg,#1a0a10,#2d0c1a)', padding:'32px 24px 28px', color:'#fff' }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          <h1 style={{ fontSize:28, fontWeight:800, margin:0 }}>🔥 Trending in Bengaluru</h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,.6)', marginTop:6 }}>What the city is obsessing over right now</p>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'24px' }}>
        {/* Tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:24, background:'#fff', border:`1px solid ${C.border}`, borderRadius:12, padding:5, width:'fit-content' }}>
          {(['restaurants','influencers'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ background:tab===t?C.coral:'none', color:tab===t?'#fff':'#888', border:'none', borderRadius:8, padding:'8px 18px', fontSize:13, fontWeight:tab===t?700:400, cursor:'pointer', textTransform:'capitalize', fontFamily:'inherit' }}>
              {t === 'restaurants' ? '🍽️ Restaurants' : '✨ Creators'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>Loading trending…</div>
        ) : tab === 'restaurants' ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {restaurants.map((r, i) => (
              <Link key={r.id} href={`/restaurants/${r.slug}`} style={{ textDecoration:'none', color:'inherit' }}>
                <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden', transition:'transform .15s,box-shadow .15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 6px 20px rgba(0,0,0,.08)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.boxShadow='' }}>
                  <div style={{ height:100, background:'linear-gradient(135deg,#FEF0EA,#FEF9F6)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px' }}>
                    <span style={{ fontSize:48 }}>{r.emoji || '🍽️'}</span>
                    <span style={{ fontSize:13, fontWeight:800, color:C.coral, background:'#fff', padding:'4px 10px', borderRadius:20 }}>#{i+1}</span>
                  </div>
                  <div style={{ padding:16 }}>
                    <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{r.name}</div>
                    <div style={{ fontSize:12, color:'#888', marginBottom:10 }}>📍 {r.area_label} · {r.price_tier}</div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:13, color:'#F5A623' }}>⭐ {r.rating ?? '—'}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:C.coral, background:'#FEF0EA', padding:'2px 8px', borderRadius:8 }}>AI {r.intelligence_score ?? '—'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
            {influencers.map((inf, i) => (
              <Link key={inf.id} href={`/influencers/${inf.slug}`} style={{ textDecoration:'none', color:'inherit' }}>
                <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                    <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#7F77DD,#a5a0f0)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'#fff', flexShrink:0 }}>
                      {(inf.name || 'I').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700 }}>{inf.name}</div>
                      <div style={{ fontSize:12, color:'#888' }}>@{inf.handle}</div>
                    </div>
                    <span style={{ marginLeft:'auto', fontSize:13, fontWeight:800, color:'#7F77DD', background:'#F3EFFE', padding:'2px 8px', borderRadius:20 }}>#{i+1}</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div style={{ background:'#fafafa', borderRadius:8, padding:10, textAlign:'center' }}>
                      <div style={{ fontSize:15, fontWeight:700, color:'#7F77DD' }}>{inf.impact_score}</div>
                      <div style={{ fontSize:10, color:'#aaa' }}>Impact</div>
                    </div>
                    <div style={{ background:'#fafafa', borderRadius:8, padding:10, textAlign:'center' }}>
                      <div style={{ fontSize:15, fontWeight:700, color:C.green }}>{inf.engagement_rate}%</div>
                      <div style={{ fontSize:10, color:'#aaa' }}>Engagement</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
