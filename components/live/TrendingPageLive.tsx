import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { PageLoader } from '@/components/Skeleton'
import { getTrendingDishes, getTrendingZones, getTrendingRestaurants, getInfluencers } from '@/lib/queries'

export default async function TrendingPageLive() {
  const [dishes, zones, restaurants, influencersResult] = await Promise.all([
    getTrendingDishes(8),
    getTrendingZones(),
    getTrendingRestaurants(6),
    getInfluencers({ limit: 5, offset: 0 }),
  ])
  const influencers = influencersResult.data

  const palette = [
    { bg: '#FEF0EA', color: '#E85D26' }, { bg: '#FEF5EA', color: '#D4860A' },
    { bg: '#EAF8EE', color: '#2E9E55' }, { bg: '#F3EFFE', color: '#7F77DD' },
    { bg: '#EAF4FE', color: '#2E7BD4' }, { bg: '#FEEBF0', color: '#D4204D' },
    { bg: '#F5FEEA', color: '#5DA618' }, { bg: '#FEF9EA', color: '#B8860B' },
  ]

  return (
    <div style={{ fontFamily: "-apple-system,sans-serif", background: '#fafafa', minHeight: '100vh', color: '#1a1a1a' }}>
      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', background: '#fff', borderBottom: '1px solid #ede8e2', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 16, textDecoration: 'none', color: '#1a1a1a' }}>Food<span style={{ color: '#E85D26' }}>Culture</span>.ai</Link>
        <div style={{ display: 'flex', gap: 20 }}>
          {[['/restaurants','Restaurants'],['/trending','Trending'],['/explore','Explore']].map(([h,l]) => (
            <Link key={h} href={h} style={{ fontSize: 13, color: h === '/trending' ? '#E85D26' : '#666', textDecoration: 'none', fontWeight: h === '/trending' ? 600 : 400 }}>{l}</Link>
          ))}
        </div>
        <Link href="/dashboard" style={{ background: '#E85D26', color: '#fff', borderRadius: 20, padding: '8px 18px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Dashboard</Link>
      </nav>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#fff9f6,#fff)', padding: '32px 24px', borderBottom: '1px solid #ede8e2', textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>📈 What&apos;s Trending in Bengaluru</h1>
        <p style={{ fontSize: 14, color: '#888' }}>Updated live · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* TRENDING DISHES */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>🍛 Viral Dishes This Week</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {dishes.map((d, i) => {
              const p = palette[i % palette.length]
              return (
                <div key={d.id} style={{ background: '#fff', border: '1px solid #ede8e2', borderRadius: 14, padding: '18px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{d.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: p.color, fontWeight: 600, background: p.bg, borderRadius: 10, padding: '2px 10px', display: 'inline-block', marginBottom: 4 }}>{d.trend_label}</div>
                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>{d.restaurant_count} restaurants</div>
                </div>
              )
            })}
          </div>
        </section>

        <div style={{ height: 1, background: '#f0e8e0' }} />

        {/* TRENDING ZONES */}
        <section>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>📍 Trending Zones · Live Scores</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {zones.map((z, i) => {
              const p = palette[i % palette.length]
              return (
                <div key={z.id} style={{ background: p.bg, borderRadius: 12, padding: '18px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>📍</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: p.color, marginBottom: 6 }}>{z.name}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: p.color, lineHeight: 1 }}>{z.trend_score}</div>
                  <div style={{ fontSize: 10, color: p.color, opacity: 0.8, marginTop: 4 }}>Trend score</div>
                  {/* Score bar */}
                  <div style={{ height: 4, background: `${p.color}30`, borderRadius: 4, marginTop: 10 }}>
                    <div style={{ height: '100%', borderRadius: 4, background: p.color, width: `${z.trend_score}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <div style={{ height: 1, background: '#f0e8e0' }} />

        {/* TRENDING RESTAURANTS */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>🔥 Restaurants on Fire</h2>
            <Link href="/restaurants" style={{ fontSize: 13, color: '#E85D26', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {restaurants.map(r => (
              <Link key={r.id} href={`/restaurants/${r.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ background: '#fff', border: '1px solid #ede8e2', borderRadius: 14, overflow: 'hidden' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(232,93,38,.1)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                >
                  <div style={{ height: 80, background: '#FEF0EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>{r.emoji}</div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>📍 {r.area_label} · {r.price_tier}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>⭐ {r.rating}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#E85D26' }}>Score: {r.intelligence_score}</span>
                    </div>
                    <div style={{ height: 3, background: '#f0ebe5', borderRadius: 3, marginTop: 8 }}>
                      <div style={{ height: '100%', borderRadius: 3, background: '#E85D26', width: `${r.intelligence_score}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div style={{ height: 1, background: '#f0e8e0' }} />

        {/* INFLUENCER LEADERBOARD */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>🏆 Creator Leaderboard · This Week</h2>
          </div>
          <div style={{ background: '#fff', border: '1px solid #ede8e2', borderRadius: 14, overflow: 'hidden' }}>
            {influencers.map((inf, i) => (
              <Link key={inf.id} href={`/influencers/${inf.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < influencers.length - 1 ? '1px solid #f0ebe5' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fff9f6')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                >
                  <div style={{ fontSize: 18, fontWeight: 700, color: i === 0 ? '#E85D26' : i === 1 ? '#D4860A' : '#888', width: 28, textAlign: 'center' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: palette[i % palette.length].bg, color: palette[i % palette.length].color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0, overflow: 'hidden' }}>
                    {inf.avatar_url ? (
                      <img src={inf.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : inf.avatar_initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{inf.name}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{inf.handle} · {(inf.followers_count / 1000).toFixed(0)}K followers</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#E85D26' }}>{inf.impact_score}%</div>
                    <div style={{ fontSize: 10, color: '#aaa' }}>impact</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{inf.visits_driven_weekly}</div>
                    <div style={{ fontSize: 10, color: '#aaa' }}>visits/wk</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
