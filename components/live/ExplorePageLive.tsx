'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import RestaurantCard from '@/components/RestaurantCard'
import InfluencerCard from '@/components/InfluencerCard'
import Footer from '@/components/Footer'
import { GridSkeleton } from '@/components/Skeleton'
import { getRestaurants, getInfluencers, getTrendingZones } from '@/lib/queries'
import type { Restaurant, Influencer, Zone } from '@/types/database'

const C = { coral:'#E85D26', border:'#ede8e2' }
type Tab = 'restaurants'|'influencers'|'zones'
const PAGE_SIZE = 12

export default function ExplorePageLive() {
  const router = useRouter()
  const params = useSearchParams()
  const [tab, setTab]               = useState<Tab>('restaurants')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [zones, setZones]           = useState<Zone[]>([])
  const [search, setSearch]         = useState(params.get('q') ?? '')
  const [loading, setLoading]       = useState(true)
  const [restPage, setRestPage]     = useState(1)
  const [infPage,  setInfPage]      = useState(1)
  const [restTotal, setRestTotal]   = useState(0)
  const [infTotal,  setInfTotal]    = useState(0)

  useEffect(() => {
    Promise.all([
      getRestaurants({ limit:12, offset:0 }),
      getInfluencers({ limit:12, offset:0 }),
      getTrendingZones(),
    ]).then(([{ data: r, count: rc }, { data: i, count: ic }, z]) => {
      setRestaurants(r); setRestTotal(rc)
      setInfluencers(i); setInfTotal(ic)
      setZones(z); setLoading(false)
    })
  }, [])

  // Sync search input with URL param
  useEffect(() => {
    const q = params.get('q') ?? ''
    setSearch(q)
    if (q) setTab('restaurants')
  }, [params])

  function updateSearch(val: string) {
    setSearch(val)
    setRestPage(1); setInfPage(1)
    const url = val ? `/explore?q=${encodeURIComponent(val)}` : '/explore'
    router.replace(url, { scroll: false })
  }

  const filteredR = restaurants.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.area_label??'').toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine_tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )
  const filteredI = influencers.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.handle.toLowerCase().includes(search.toLowerCase()) ||
    i.cuisine_tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  const shownR = filteredR.slice(0, restPage * PAGE_SIZE)
  const shownI = filteredI.slice(0, infPage * PAGE_SIZE)
  const palette = [{bg:'#FEF0EA',color:'#E85D26'},{bg:'#EAF8EE',color:'#2E9E55'},{bg:'#F3EFFE',color:'#7F77DD'},{bg:'#FEF5EA',color:'#D4860A'},{bg:'#EAF4FE',color:'#2E7BD4'}]

  return (
    <div style={{ fontFamily:"-apple-system,sans-serif", background:'#fafafa', minHeight:'100vh', color:'#1a1a1a' }}>
      <Nav />

      <div style={{ background:'linear-gradient(135deg,#fff9f6,#fff)', padding:'32px 24px 0', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <h1 style={{ fontSize:24, fontWeight:700, marginBottom:6 }}>🔍 Explore Bengaluru</h1>
          <p style={{ fontSize:14, color:'#888', marginBottom:20 }}>Search restaurants, influencers, and zones</p>
          <div style={{ display:'flex', alignItems:'center', background:'#fff', border:`2px solid ${C.coral}`, borderRadius:40, padding:'8px 8px 8px 18px', gap:10, maxWidth:520, marginBottom:14 }}>
            <label htmlFor="explore-search" style={{ display:'none' }}>Search</label>
            <span aria-hidden="true">🔍</span>
            <input id="explore-search" type="search" value={search} onChange={e => updateSearch(e.target.value)}
              placeholder="Search by name, area, cuisine, or handle..." aria-label="Search restaurants and influencers"
              style={{ background:'none', border:'none', outline:'none', fontSize:14, flex:1 }} />
            {search && <button onClick={() => updateSearch('')} aria-label="Clear search" style={{ background:'none', border:'none', cursor:'pointer', color:'#aaa', fontSize:16 }}>✕</button>}
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            {['Biryani','Koramangala','Street food','South Indian','Late night'].map(c => (
              <button key={c} onClick={() => updateSearch(c)}
                style={{ background: search===c ? C.coral : '#fff', color: search===c ? '#fff' : '#666', border:`1px solid ${search===c ? C.coral : C.border}`, borderRadius:20, padding:'5px 14px', fontSize:12, cursor:'pointer' }}>
                {c}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:0 }} role="tablist">
            {([
              ['restaurants',`🍽️ Restaurants (${filteredR.length})`],
              ['influencers', `✨ Influencers (${filteredI.length})`],
              ['zones',       `📍 Zones (${zones.length})`],
            ] as [Tab,string][]).map(([key,label]) => (
              <button key={key} onClick={() => setTab(key)}
                role="tab" aria-selected={tab===key} aria-controls={`panel-${key}`}
                style={{ background:'none', border:'none', borderBottom: tab===key ? `2px solid ${C.coral}` : '2px solid transparent', padding:'12px 20px', fontSize:13, fontWeight: tab===key ? 600 : 400, color: tab===key ? C.coral : '#666', cursor:'pointer', marginBottom:-1 }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px' }}>
        {loading ? <GridSkeleton count={6} cols={3} /> : (
          <>
            {tab === 'restaurants' && (
              <div id="panel-restaurants" role="tabpanel">
                {shownR.length === 0
                  ? <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>No restaurants match &ldquo;{search}&rdquo;</div>
                  : <>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
                      {shownR.map(r => (
                        <RestaurantCard key={r.id} restaurant={r} />
                      ))}
                    </div>
                    {shownR.length < filteredR.length && (
                      <div style={{ textAlign:'center', marginTop:24 }}>
                        <button onClick={() => setRestPage(p => p+1)}
                          style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:24, padding:'10px 28px', fontSize:13, color:'#666', cursor:'pointer' }}>
                          Load more ({filteredR.length - shownR.length} remaining)
                        </button>
                      </div>
                    )}
                  </>
                }
              </div>
            )}

            {tab === 'influencers' && (
              <div id="panel-influencers" role="tabpanel">
                {shownI.length === 0
                  ? <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>No influencers match &ldquo;{search}&rdquo;</div>
                  : <>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
                      {shownI.map((inf,i) => {
                        const p = palette[i%palette.length]
                        return (
                          <InfluencerCard key={inf.id} influencer={inf} index={shownI.indexOf(inf)} />
                        )
                      })}
                    </div>
                    {shownI.length < filteredI.length && (
                      <div style={{ textAlign:'center', marginTop:24 }}>
                        <button onClick={() => setInfPage(p => p+1)}
                          style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:24, padding:'10px 28px', fontSize:13, color:'#666', cursor:'pointer' }}>
                          Load more ({filteredI.length - shownI.length} remaining)
                        </button>
                      </div>
                    )}
                  </>
                }
              </div>
            )}

            {tab === 'zones' && (
              <div id="panel-zones" role="tabpanel" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14 }}>
                {zones.map((z,i) => {
                  const p = palette[i%palette.length]
                  return (
                    <div key={z.id} style={{ background:p.bg, borderRadius:14, padding:22, textAlign:'center' }}>
                      <div style={{ fontSize:32, marginBottom:8 }} aria-hidden="true">📍</div>
                      <div style={{ fontSize:15, fontWeight:700, color:p.color, marginBottom:8 }}>{z.name}</div>
                      <div style={{ fontSize:36, fontWeight:700, color:p.color, lineHeight:1 }} aria-label={`Trend score ${z.trend_score}`}>{z.trend_score}</div>
                      <div style={{ fontSize:11, color:p.color, opacity:0.8, marginTop:4, marginBottom:12 }}>Trend score</div>
                      <div style={{ height:5, background:`${p.color}25`, borderRadius:4 }} role="progressbar" aria-valuenow={z.trend_score} aria-valuemin={0} aria-valuemax={100} aria-label={z.name}>
                        <div style={{ height:'100%', borderRadius:4, background:p.color, width:`${z.trend_score}%` }} />
                      </div>
                      <button onClick={() => { setTab('restaurants'); updateSearch(z.name) }}
                        style={{ marginTop:14, background:p.color, color:'#fff', border:'none', borderRadius:20, padding:'7px 16px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        Browse restaurants →
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
