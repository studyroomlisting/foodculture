'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

const C = { coral: '#E85D26', purple: '#7F77DD', green: '#2E9E55', amber: '#D4860A', border: '#ede8e2', dark: '#1a1a1a' }

function KpiCard({ icon, label, value, sub, change, color = C.purple }: {
  icon: string; label: string; value: string; sub?: string; change?: number; color?: string
}) {
  const up = (change ?? 0) >= 0
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        {change !== undefined && (
          <span style={{ fontSize: 12, fontWeight: 700, color: up ? C.green : '#dc2626', background: up ? '#EAF8EE' : '#fef2f2', padding: '2px 8px', borderRadius: 20 }}>
            {up ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function MiniChart({ data, valueKey, color }: { data: any[]; valueKey: string; color: string }) {
  if (!data.length) return <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 12 }}>No data yet</div>
  const vals   = data.map(d => d[valueKey] ?? 0)
  const maxVal = Math.max(...vals, 1)
  const BAR_W  = Math.min(28, Math.floor(280 / data.length) - 3)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 64, padding: '0 4px' }}>
      {vals.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div title={String(v)}
            style={{ width: '100%', maxWidth: BAR_W, height: Math.max(3, Math.round((v / maxVal) * 52)), background: color, borderRadius: '3px 3px 0 0', opacity: 0.85, transition: 'height .3s' }} />
        </div>
      ))}
    </div>
  )
}

function TrendChart({ trend }: { trend: any[] }) {
  if (!trend.length) return (
    <div style={{ textAlign: 'center', padding: 32, color: '#aaa' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
      <p style={{ fontSize: 13 }}>No trend data yet. Post some content to see your analytics.</p>
    </div>
  )
  const maxV = Math.max(...trend.map(d => d.total_views ?? 0), 1)
  const maxT = Math.max(...trend.map(d => d.visits_driven ?? 0), 1)
  const H = 120

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.purple }}>● Views</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.coral }}>● Visits driven</span>
      </div>
      <div style={{ position: 'relative', height: H + 28, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
        {trend.map((d, i) => {
          const vh = Math.max(3, Math.round(((d.total_views ?? 0) / maxV) * H))
          const th = Math.max(3, Math.round(((d.visits_driven ?? 0) / maxT) * H))
          const label = (d.date ?? '').slice(5)
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 1, height: H }}>
                <div style={{ width: '42%', height: vh, background: C.purple, borderRadius: '3px 3px 0 0', opacity: 0.8 }} title={`Views: ${d.total_views}`} />
                <div style={{ width: '42%', height: th, background: C.coral, borderRadius: '3px 3px 0 0', opacity: 0.8 }} title={`Visits: ${d.visits_driven}`} />
              </div>
              <div style={{ fontSize: 9, color: '#aaa', whiteSpace: 'nowrap' }}>{label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function InfluencerAnalyticsPage() {
  const router  = useRouter()
  const [data,  setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab,   setTab]     = useState<'overview'|'posts'|'campaigns'>('overview')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/signin'); return }
      const res = await fetch('/api/analytics/influencer')
      if (!res.ok) { router.push('/dashboard'); return }
      setData(await res.json())
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div style={{ minHeight: '100vh', fontFamily: '-apple-system,sans-serif' }}>
      <Nav />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${C.purple}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <div style={{ fontSize: 14, color: '#888' }}>Loading analytics…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )

  const { kpis, trend, posts, campaigns, top_restaurants, period_comparison, influencer } = data

  const fmt = (n: number) => n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n)
  const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  return (
    <div style={{ fontFamily: '-apple-system,sans-serif', background: '#fafafa', minHeight: '100vh', color: C.dark }}>
      <Nav />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1a0a30,#2d1560)', padding: '28px 28px 24px', color: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Link href="/dashboard/influencer" style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>← Dashboard</Link>
                <span style={{ color: 'rgba(255,255,255,.3)' }}>›</span>
                <span style={{ fontSize: 13, color: '#fff' }}>Analytics</span>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>📊 Analytics</h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>
                {influencer ? `${influencer.name} · @${influencer.handle}` : 'Your creator performance'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {kpis.rank && (
                <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 12, padding: '10px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>#{kpis.rank}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>Platform rank</div>
                  {kpis.rank_last_week && kpis.rank < kpis.rank_last_week && (
                    <div style={{ fontSize: 10, color: '#4ade80' }}>↑ from #{kpis.rank_last_week}</div>
                  )}
                </div>
              )}
              <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 12, padding: '10px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{kpis.impact_score || '—'}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>Impact score</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px' }}>
        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
          <KpiCard icon="👁️" label="Total views"      value={fmt(kpis.total_views)}   change={period_comparison.views_change}  color={C.purple} sub={`${fmt(period_comparison.this_week_views)} this week`} />
          <KpiCard icon="🚶" label="Visits driven"     value={fmt(kpis.total_visits)}  change={period_comparison.visits_change} color={C.coral}  sub={`${fmt(period_comparison.this_week_visits)} this week`} />
          <KpiCard icon="📸" label="Total posts"       value={String(kpis.total_posts)} change={period_comparison.posts_change} color={C.amber}  />
          <KpiCard icon="❤️" label="Total likes"       value={fmt(kpis.total_likes)}   color="#e11d48" />
          <KpiCard icon="💬" label="Avg engagement"    value={`${kpis.avg_engagement}%`} color={C.green} sub="likes+comments / views" />
          <KpiCard icon="👥" label="Followers"         value={fmt(kpis.followers)}     color={C.purple} sub={influencer?.platform ?? 'Instagram'} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 5, width: 'fit-content' }}>
          {(['overview','posts','campaigns'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ background: tab === t ? C.purple : 'none', color: tab === t ? '#fff' : '#888', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: tab === t ? 700 : 400, cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'inherit' }}>
              {t}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Trend chart */}
              <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>📈 Views & visits trend</h2>
                  <span style={{ fontSize: 12, color: '#aaa' }}>Last {trend.length} data points</span>
                </div>
                <TrendChart trend={trend} />
              </section>

              {/* Period comparison */}
              <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🗓️ This week vs last week</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Views', tw: period_comparison.this_week_views, lw: period_comparison.last_week_views, icon: '👁️', color: C.purple },
                    { label: 'Visits driven', tw: period_comparison.this_week_visits, lw: period_comparison.last_week_visits, icon: '🚶', color: C.coral },
                  ].map(row => (
                    <div key={row.label} style={{ background: '#fafafa', borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: 18, marginBottom: 8 }}>{row.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 10 }}>{row.label}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: row.color }}>{fmt(row.tw)}</div>
                          <div style={{ fontSize: 11, color: '#aaa' }}>This week</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#bbb' }}>{fmt(row.lw)}</div>
                          <div style={{ fontSize: 11, color: '#aaa' }}>Last week</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 10, height: 4, background: '#e5e7eb', borderRadius: 4 }}>
                        <div style={{ height: '100%', width: `${row.lw + row.tw > 0 ? Math.round((row.tw / Math.max(row.tw, row.lw)) * 100) : 0}%`, background: row.color, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Top restaurants */}
              <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>🏆 Top restaurants</h2>
                {top_restaurants.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: 16 }}>No restaurant collaborations yet.</p>
                ) : top_restaurants.map((r: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF0EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{r.emoji || '🍽️'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{r.posts} post{r.posts !== 1 ? 's' : ''} · {fmt(r.views)} views</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.coral, flexShrink: 0 }}>{fmt(r.visits)} 🚶</div>
                  </div>
                ))}
              </section>

              {/* Trust & quality */}
              <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>🔒 Credibility scores</h2>
                {[
                  { label: 'Trust score',         val: kpis.trust_score,   max: 100, color: C.green },
                  { label: 'Engagement rate',      val: kpis.avg_engagement, max: 10, color: C.purple, suffix: '%' },
                ].map(s => (
                  <div key={s.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                      <span style={{ color: '#555', fontWeight: 500 }}>{s.label}</span>
                      <span style={{ fontWeight: 700, color: s.color }}>{s.val}{s.suffix ?? ''}</span>
                    </div>
                    <div style={{ height: 6, background: '#e5e7eb', borderRadius: 6 }}>
                      <div style={{ height: '100%', width: `${Math.min(100, Math.round((s.val / s.max) * 100))}%`, background: s.color, borderRadius: 6, transition: 'width .5s' }} />
                    </div>
                  </div>
                ))}
              </section>
            </div>
          </div>
        )}

        {/* POSTS TAB */}
        {tab === 'posts' && (
          <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>📸 Post performance</h2>
              <span style={{ fontSize: 13, color: '#aaa' }}>{posts.length} posts tracked</span>
            </div>
            {posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
                <p style={{ fontSize: 14 }}>No posts tracked yet. Restaurants add your content when they tag your work.</p>
              </div>
            ) : (
              <div>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 80px 80px 100px', gap: 8, padding: '10px 20px', background: '#fafafa', fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                  <span>Restaurant · Caption</span>
                  <span style={{ textAlign: 'right' }}>Views</span>
                  <span style={{ textAlign: 'right' }}>Likes</span>
                  <span style={{ textAlign: 'right' }}>Comments</span>
                  <span style={{ textAlign: 'right' }}>Visits</span>
                  <span style={{ textAlign: 'right' }}>Posted</span>
                </div>
                {posts.map((p: any) => {
                  const eng = p.views > 0 ? Math.round(((p.likes + p.comments) / p.views) * 1000) / 10 : 0
                  return (
                    <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 80px 80px 100px', gap: 8, padding: '14px 20px', borderBottom: `1px solid ${C.border}`, alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 18 }}>{p.restaurant?.emoji || '🍽️'}</span>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{p.restaurant?.name || '—'}</span>
                          <span style={{ fontSize: 11, background: eng >= 5 ? '#EAF8EE' : '#f5f5f5', color: eng >= 5 ? C.green : '#888', padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>{eng}% eng</span>
                        </div>
                        {p.caption && <div style={{ fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{p.caption}</div>}
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: C.purple }}>{fmt(p.views ?? 0)}</div>
                      <div style={{ textAlign: 'right', fontSize: 13, color: '#e11d48' }}>{fmt(p.likes ?? 0)}</div>
                      <div style={{ textAlign: 'right', fontSize: 13, color: '#888' }}>{fmt(p.comments ?? 0)}</div>
                      <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: C.coral }}>{fmt(p.visits_driven ?? 0)}</div>
                      <div style={{ textAlign: 'right', fontSize: 11, color: '#aaa' }}>{fmtDate(p.posted_at)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* CAMPAIGNS TAB */}
        {tab === 'campaigns' && (
          <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>🤝 Campaign history</h2>
            </div>
            {campaigns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
                <p style={{ fontSize: 14 }}>No campaigns yet. Restaurants will send collaboration requests once you complete your profile.</p>
                <Link href="/account" style={{ color: C.purple, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Complete your profile →</Link>
              </div>
            ) : campaigns.map((c: any) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEF0EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {c.restaurant?.emoji || '🍽️'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{c.campaign_name || `Campaign with ${c.restaurant?.name}`}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    {c.restaurant?.name} · {fmtDate(c.start_date)} → {c.end_date ? fmtDate(c.end_date) : 'ongoing'}
                  </div>
                  {c.deliverables && <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{c.deliverables}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {c.agreed_fee && (
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.green }}>₹{c.agreed_fee.toLocaleString('en-IN')}</div>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                    background: c.status === 'completed' ? '#EAF8EE' : c.status === 'active' ? '#F3EFFE' : '#f5f5f5',
                    color: c.status === 'completed' ? C.green : c.status === 'active' ? C.purple : '#888' }}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
      <Footer />
    </div>
  )
}
