import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTrendingRestaurants, getTrendingDishes, getInfluencers, getTrendingZones, getActivityFeed } from '@/lib/queries'
import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import { localBusinessSchema } from '@/lib/seo'

export default async function HomePageLive() {
  const [restaurants, dishes, influencersResult, zones, feed] = await Promise.all([
    getTrendingRestaurants(6).catch(() => []),
    getTrendingDishes(8).catch(() => []),
    getInfluencers({ limit: 4 }).catch(() => ({ data: [], count: 0 })),
    getTrendingZones().catch(() => []),
    getActivityFeed(4).catch(() => []),
  ]) as any[]
  const influencers = (influencersResult as any)?.data ?? []

  const statusColor: Record<string,string> = { viral:'#E85D26', rising:'#2E9E55', new:'#D4860A', active:'#888' }
  const statusLabel: Record<string,string> = { viral:'Viral', rising:'Rising', new:'New', active:'Active' }
  const palette = [
    {bg:'#FEF0EA',color:'#E85D26'},{bg:'#FEF5EA',color:'#D4860A'},
    {bg:'#EAF8EE',color:'#2E9E55'},{bg:'#F3EFFE',color:'#7F77DD'},
    {bg:'#EAF4FE',color:'#2E7BD4'},{bg:'#FEEBF0',color:'#D4204D'},
    {bg:'#F5FEEA',color:'#5DA618'},{bg:'#FEF9EA',color:'#B8860B'},
  ]

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", background:'#fff', color:'#1a1a1a' }}>
      <Nav />

      {/* HERO */}
      <div style={{ background:'linear-gradient(160deg,#fff9f6 0%,#fff 65%)', padding:'48px 24px 40px', textAlign:'center', borderBottom:'1px solid #f0e8e0' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'#FEF0EA', border:'1px solid #f5c4a8', borderRadius:20, padding:'6px 16px', fontSize:12, color:'#E85D26', marginBottom:20, fontWeight:500 }}>
          <span aria-hidden="true" style={{ width:7, height:7, background:'#E85D26', borderRadius:'50%', display:'inline-block' }} />
          Live · Bengaluru food intelligence
        </div>
        <h1 style={{ fontSize:38, fontWeight:700, lineHeight:1.1, letterSpacing:-1.5, marginBottom:14 }}>
          Discover what&apos;s <span style={{ color:'#E85D26' }}>trending</span><br />in food <span style={{ color:'#F5A623' }}>right now</span>
        </h1>
        <p style={{ fontSize:15, color:'#888', maxWidth:440, margin:'0 auto 28px', lineHeight:1.6 }}>
          Real-time AI intelligence on restaurants, viral dishes, and influencer impact across every Bengaluru neighbourhood.
        </p>

        {/* Search — server action redirects to /explore */}
        <form action={async (fd: FormData) => {
          'use server'
          const q = fd.get('q')?.toString().trim()
          redirect(q ? `/explore?q=${encodeURIComponent(q)}` : '/explore')
        }} style={{ maxWidth:480, margin:'0 auto 24px', background:'#fff', border:'2px solid #E85D26', borderRadius:40, display:'flex', alignItems:'center', padding:'6px 6px 6px 18px', gap:10 }}>
          <label htmlFor="hero-search" style={{ display:'none' }}>Search restaurants</label>
          <span aria-hidden="true" style={{ color:'#E85D26' }}>🔍</span>
          <input id="hero-search" name="q" type="search" placeholder="Best dosa near Indiranagar this week..."
            style={{ background:'none', border:'none', outline:'none', fontSize:14, flex:1, color:'#1a1a1a' }} />
          <button type="submit" style={{ background:'#E85D26', borderRadius:32, padding:'9px 18px', color:'#fff', fontSize:13, fontWeight:600, border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>
            ✦ Ask AI
          </button>
        </form>

        <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
          {['Viral this week','Koramangala','Biryani spots','Late night'].map(c => (
            <Link key={c} href={`/explore?q=${encodeURIComponent(c)}`} style={{ background:'#fff', border:'1px solid #e8e0d8', borderRadius:20, padding:'6px 14px', fontSize:12, color:'#666', textDecoration:'none' }}>
              {c}
            </Link>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, maxWidth:1000, margin:'0 auto', padding:24 }}>
        {[
          { num:'1.2K', label:'Restaurants tracked' },
          { num:'48K',  label:'Reviews analysed' },
          { num:'544+', label:'Influencers scored' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff9f6', border:'1px solid #f5e0d0', borderRadius:12, padding:18, textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:700 }}>{s.num}</div>
            <div style={{ fontSize:12, color:'#aaa', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ height:1, background:'#f5ede5', margin:'0 24px' }} />

      {/* TRENDING RESTAURANTS */}
      <section aria-labelledby="trending-restaurants" style={{ padding:'28px 24px', maxWidth:1000, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <h2 id="trending-restaurants" style={{ fontSize:16, fontWeight:600, margin:0 }}>🔥 Trending restaurants right now</h2>
          <Link href="/restaurants" style={{ fontSize:13, color:'#E85D26', textDecoration:'none' }}>View all →</Link>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {restaurants.slice(0,6).map(r => (
            <Link key={r.id} href={`/restaurants/${r.slug}`} style={{ textDecoration:'none', color:'inherit' }}>
              <article style={{ background:'#fff', border:'1px solid #ede8e2', borderRadius:14, overflow:'hidden' }}>
                <div style={{ height:80, background:'#FEF0EA', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34 }} aria-hidden="true">{r.emoji}</div>
                <div style={{ padding:12 }}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>{r.name}</div>
                  <div style={{ fontSize:11, color:'#aaa', marginBottom:8 }}>📍 {r.area_label} · {r.price_tier}</div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:12, fontWeight:600 }}>⭐ {r.rating}</span>
                    <span style={{ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:10, background:'#FEF0EA', color: statusColor[r.status]??'#888' }}>{statusLabel[r.status]??r.status}</span>
                  </div>
                  <div style={{ height:3, background:'#f5f0eb', borderRadius:3, marginTop:8 }}>
                    <div style={{ height:'100%', borderRadius:3, background: statusColor[r.status]??'#E85D26', width:`${r.intelligence_score}%` }} />
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <div style={{ height:1, background:'#f5ede5', margin:'0 24px' }} />

      {/* TRENDING DISHES */}
      <section aria-labelledby="trending-dishes" style={{ padding:'28px 24px', maxWidth:1000, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <h2 id="trending-dishes" style={{ fontSize:16, fontWeight:600, margin:0 }}>📈 Trending dishes this week</h2>
          <Link href="/trending" style={{ fontSize:13, color:'#E85D26', textDecoration:'none' }}>View all →</Link>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {dishes.slice(0,8).map(d => (
            <Link key={d.id} href={`/explore?q=${encodeURIComponent(d.name)}`} style={{ textDecoration:'none', color:'inherit' }}>
              <div style={{ background:'#fff', border:'1px solid #ede8e2', borderRadius:14, padding:'14px 10px', textAlign:'center' }}>
                <div style={{ fontSize:26, marginBottom:6 }} aria-hidden="true">{d.emoji}</div>
                <div style={{ fontSize:12, fontWeight:600 }}>{d.name}</div>
                <div style={{ fontSize:10, color:'#E85D26', fontWeight:600, marginTop:2 }}>{d.trend_label}</div>
                <div style={{ fontSize:9, color:'#aaa', marginTop:3 }}>{d.restaurant_count} restaurants</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div style={{ height:1, background:'#f5ede5', margin:'0 24px' }} />

      {/* TOP INFLUENCERS */}
      <section aria-labelledby="top-influencers" style={{ padding:'28px 24px', maxWidth:1000, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <h2 id="top-influencers" style={{ fontSize:16, fontWeight:600, margin:0 }}>⭐ Top food influencers · Bengaluru</h2>
          <Link href="/influencers" style={{ fontSize:13, color:'#E85D26', textDecoration:'none' }}>View all →</Link>
        </div>
        {influencers[0] && (
          <Link href={`/influencers/${influencers[0].slug}`} style={{ textDecoration:'none', color:'inherit' }}>
            <div style={{ background:'#FEF9F6', border:'1px solid #f5d5c0', borderRadius:14, padding:16, marginBottom:12, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:50, height:50, borderRadius:'50%', background:'#FEF0EA', color:'#E85D26', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:17, border:'2px solid #E85D26', flexShrink:0 }} aria-hidden="true">
                {influencers[0].avatar_initials}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600 }}>{influencers[0].name}</div>
                <div style={{ fontSize:11, color:'#888', marginBottom:10 }}>{influencers[0].handle} · {(influencers[0].followers_count/1000).toFixed(0)}K followers</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {[
                    { label:'Visit conversion', val:influencers[0].impact_score, color:'#E85D26' },
                    { label:'Audience trust',   val:influencers[0].trust_score,  color:'#F5A623' },
                  ].map(b => (
                    <div key={b.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:10, color:'#aaa', width:95 }}>{b.label}</span>
                      <div style={{ flex:1, height:5, background:'#f0e8e0', borderRadius:3 }} role="progressbar" aria-valuenow={b.val} aria-valuemin={0} aria-valuemax={100} aria-label={b.label}>
                        <div style={{ height:'100%', borderRadius:3, background:b.color, width:`${b.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:24, fontWeight:700, color:'#E85D26', lineHeight:1 }}>{influencers[0].impact_score}%</div>
                <div style={{ fontSize:9, color:'#aaa', marginTop:3 }}>impact score</div>
              </div>
            </div>
          </Link>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {influencers.slice(1,4).map((inf,i) => (
            <Link key={inf.id} href={`/influencers/${inf.slug}`} style={{ textDecoration:'none', color:'inherit' }}>
              <div style={{ background:'#fff', border:'1px solid #ede8e2', borderRadius:14, padding:14, textAlign:'center' }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#FEF0EA', color:'#E85D26', fontSize:9, fontWeight:600, padding:'3px 8px', borderRadius:10, marginBottom:8 }} aria-label={`Ranked #${i+2} this week`}>
                  🏆 #{i+2}
                </div>
                <div style={{ width:44, height:44, borderRadius:'50%', margin:'0 auto 8px', background:'#FEF0EA', color:'#E85D26', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, border:'2px solid #f5ede5' }} aria-hidden="true">
                  {inf.avatar_initials}
                </div>
                <div style={{ fontSize:13, fontWeight:600 }}>{inf.name}</div>
                <div style={{ fontSize:10, color:'#aaa', marginBottom:10 }}>{inf.handle} · {(inf.followers_count/1000).toFixed(0)}K</div>
                <div style={{ display:'flex', justifyContent:'space-around', borderTop:'1px solid #f0ebe5', paddingTop:10 }}>
                  <div><div style={{ fontSize:13, fontWeight:700 }}>{inf.impact_score}%</div><div style={{ fontSize:8, color:'#bbb' }}>Impact</div></div>
                  <div><div style={{ fontSize:13, fontWeight:700 }}>{inf.visits_driven_weekly}</div><div style={{ fontSize:8, color:'#bbb' }}>Visits/wk</div></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div style={{ height:1, background:'#f5ede5', margin:'0 24px' }} />

      {/* TRENDING ZONES */}
      <section aria-labelledby="trending-zones" style={{ padding:'28px 24px', maxWidth:1000, margin:'0 auto' }}>
        <h2 id="trending-zones" style={{ fontSize:16, fontWeight:600, marginBottom:18 }}>📍 Trending zones · Live</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {zones.slice(0,8).map((z,i) => {
            const p = palette[i%palette.length]
            return (
              <Link key={z.id} href={`/explore?q=${encodeURIComponent(z.name)}`} style={{ textDecoration:'none', color:'inherit' }}>
                <div style={{ borderRadius:12, padding:'14px 10px', textAlign:'center', background:p.bg }}>
                  <div style={{ fontSize:20, marginBottom:5 }} aria-hidden="true">📍</div>
                  <div style={{ fontSize:12, fontWeight:600, color:p.color, marginBottom:5 }}>{z.name}</div>
                  <div style={{ fontSize:20, fontWeight:700, color:p.color }} aria-label={`Trend score ${z.trend_score}`}>{z.trend_score}</div>
                  <div style={{ fontSize:9, marginTop:3, opacity:0.7, color:p.color }}>Trend score</div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <div style={{ height:1, background:'#f5ede5', margin:'0 24px' }} />

      {/* LIVE FEED */}
      <section aria-labelledby="live-feed" style={{ padding:'28px 24px', maxWidth:1000, margin:'0 auto' }}>
        <h2 id="live-feed" style={{ fontSize:16, fontWeight:600, marginBottom:16 }}>⚡ Live activity feed</h2>
        {feed.map(item => (
          <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10, background:'#FEF9F6', border:'1px solid #f5d5c0', borderRadius:10, padding:'12px 14px', marginBottom:8 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:item.dot_color, flexShrink:0, display:'inline-block' }} aria-hidden="true" />
            <span style={{ fontSize:13, flex:1 }} dangerouslySetInnerHTML={{ __html: item.message }} />
            <time style={{ fontSize:10, color:'#aaa', flexShrink:0 }} dateTime={item.created_at}>
              {new Date(item.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
            </time>
          </div>
        ))}
      </section>

      <Footer />
    </div>
  )
}
