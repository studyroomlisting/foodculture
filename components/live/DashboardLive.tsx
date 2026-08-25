'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { PageLoader } from '@/components/Skeleton'
import { supabase } from '@/lib/supabase'
import { getDashboardStats, getRestaurants, getDealsForRestaurant, getPostsForRestaurant } from '@/lib/queries'
import type { Restaurant, InfluencerRestaurantPost, Deal } from '@/types/database'

const C = { coral: '#E85D26', gold: '#F5A623', green: '#2E9E55', border: '#ede8e2' }

export default function DashboardLive() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selected, setSelected] = useState<Restaurant | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [posts, setPosts] = useState<InfluencerRestaurantPost[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'influencers' | 'deals'>('overview')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: r } = await (supabase as any)
        .from('restaurants')
        .select('id,slug,name,emoji,area_label,cuisine_tags,price_tier,open_until,peak_hours,listing_status,rejection_reason,intelligence_score,intelligence_score_trend,status,rating,total_reviews,ai_brief,avg_spend')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
      const owned = r ?? []
      setRestaurants(owned)
      if (owned[0]) selectRestaurant(owned[0])
    })
  }, [])

  async function selectRestaurant(r: Restaurant) {
    setSelected(r)
    setLoading(true)
    const [s, ps, ds] = await Promise.all([
      getDashboardStats(r.id),
      getPostsForRestaurant(r.id),
      getDealsForRestaurant(r.id),
    ])
    setStats(s)
    setPosts(ps)
    setDeals(ds)
    setLoading(false)
  }

  // ── Move a draft listing to pending_review — the button that was missing:
  // listings created via /dashboard/listings/new started life as 'draft' with
  // no way to advance them (only the post-signup onboarding wizard had a
  // "Submit for review" action, and only for listings created there).
  async function submitForReview() {
    if (!selected) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    const { error } = await (supabase as any)
      .from('restaurants')
      .update({ listing_status: 'pending_review', submitted_at: new Date().toISOString() })
      .eq('id', selected.id)
      .eq('owner_id', user.id)

    if (!error) {
      const updated = { ...(selected as any), listing_status: 'pending_review' } as Restaurant
      setSelected(updated)
      setRestaurants(prev => prev.map(r => (r.id === updated.id ? updated : r)))

      // Best-effort audit log + notification email — wrapped in try/catch since
      // the Supabase query builder isn't a real Promise (no .catch()).
      try {
        await (supabase as any).from('audit_logs').insert([{
          actor_id: user.id,
          action: 'listing.submitted',
          target_table: 'restaurants',
          target_id: selected.id,
          metadata: { restaurant_name: selected.name },
        }])
      } catch {}
      try {
        await fetch('/api/auth/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'listing_submitted', data: { restaurantName: selected.name } }),
        })
      } catch {}
    }
    setSubmitting(false)
  }

  return (
    <div style={{ fontFamily: "-apple-system,sans-serif", background: '#fafafa', minHeight: '100vh', color: '#1a1a1a', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      {/* QUICK ACTIONS */}
      <div style={{ background:'#fff', borderBottom:`1px solid ${C.border}`, padding:'10px 24px', display:'flex', gap:8, flexWrap:'wrap' }}>
        <Link href="/dashboard/listings/new" style={{ background:C.coral, color:'#fff', borderRadius:20, padding:'7px 16px', fontSize:12, fontWeight:600, textDecoration:'none' }}>+ Add listing</Link>
        <Link href="/dashboard/enquiries"    style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:20, padding:'7px 16px', fontSize:12, color:'#666', textDecoration:'none' }}>📬 Enquiries</Link>
        <Link href="/dashboard/saved"        style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:20, padding:'7px 16px', fontSize:12, color:'#666', textDecoration:'none' }}>❤️ Saved</Link>
        <Link href="/influencers"            style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:20, padding:'7px 16px', fontSize:12, color:'#666', textDecoration:'none' }}>✨ Find influencers</Link>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* SIDEBAR — restaurant picker */}
        <div style={{ width: 240, background: '#fff', borderRight: `1px solid ${C.border}`, padding: '20px 0', flexShrink: 0 }}>
          <div style={{ padding: '0 16px 12px', fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>Your restaurants</div>
          {restaurants.map(r => (
            <button key={r.id} onClick={() => selectRestaurant(r)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: selected?.id === r.id ? '#FEF0EA' : 'none', border: 'none', borderLeft: selected?.id === r.id ? `3px solid ${C.coral}` : '3px solid transparent', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 22 }}>{r.emoji}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{r.name}</div>
                <div style={{ fontSize: 10, color: '#aaa' }}>{r.area_label}</div>
                {(r as any).listing_status === 'approved' && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 6, background: '#EAF8EE', color: '#2E9E55' }}>✓ Live</span>}
                {(r as any).listing_status === 'pending_review' && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 6, background: '#FEF9EA', color: '#D4860A' }}>⏳ Pending</span>}
                {(r as any).listing_status === 'draft' && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 6, background: '#f5f5f5', color: '#888' }}>📝 Draft</span>}
              </div>
            </button>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
          {!selected ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Select a restaurant</div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Loading dashboard…</div>
          ) : (
            <>
              {/* Restaurant header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <span style={{ fontSize: 36 }}>{selected.emoji}</span>
                <div>
                  <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selected.name}</h1>
                  <div style={{ fontSize: 13, color: '#888' }}>{selected.area_label} · {selected.price_tier} · ⭐ {selected.rating}</div>
                </div>
                <Link href={`/dashboard/listings/${selected.id}/edit`}
                  style={{ marginLeft: 12, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#666', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  ✏️ Edit listing
                </Link>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: C.coral }}>{selected.intelligence_score}</div>
                  <div style={{ fontSize: 10, color: '#aaa' }}>AI Score</div>
                  <div style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>+{selected.intelligence_score_trend} this week</div>
                </div>
              </div>

              {/* DRAFT — nudge to submit for review, and rejected — show why + let them resubmit */}
              {(selected as any).listing_status === 'draft' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#FEF9F6', border: '1px solid #f5d5c0', borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
                  <span style={{ fontSize: 24 }}>📝</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>This listing is still a draft</div>
                    <div style={{ fontSize: 13, color: '#888' }}>It's not visible to anyone yet. Add photos below (optional), then submit — our team reviews new listings within 24–48 hours.</div>
                  </div>
                  <button onClick={submitForReview} disabled={submitting}
                    style={{ background: C.coral, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.7 : 1, whiteSpace: 'nowrap' }}>
                    {submitting ? 'Submitting…' : 'Submit for review ✓'}
                  </button>
                </div>
              )}
              {(selected as any).listing_status === 'rejected' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
                  <span style={{ fontSize: 24 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, color: '#dc2626' }}>This listing was rejected</div>
                    <div style={{ fontSize: 13, color: '#888' }}>{(selected as any).rejection_reason || 'No reason was given.'} Update the details via Edit, then resubmit.</div>
                  </div>
                  <button onClick={submitForReview} disabled={submitting}
                    style={{ background: C.coral, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.7 : 1, whiteSpace: 'nowrap' }}>
                    {submitting ? 'Submitting…' : 'Resubmit ✓'}
                  </button>
                </div>
              )}

              {/* KPI CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
                {[
                  { icon: '🚶', label: 'Visits driven',    val: stats.totalVisits.toLocaleString(),    sub: 'via influencer posts' },
                  { icon: '👁',  label: 'Total views',     val: stats.totalViews.toLocaleString(),     sub: 'across all posts' },
                  { icon: '❤️',  label: 'Likes & comments', val: (stats.totalLikes + stats.totalComments).toLocaleString(), sub: 'total engagement' },
                  { icon: '⭐',  label: 'Avg review',      val: stats.avgRating,                       sub: `from ${stats.totalReviews} reviews` },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{k.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>{k.val}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>{k.label}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* TABS */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
                {[['overview','📊 Overview'],['influencers',`✨ Influencers (${posts.length})`],['deals',`🎟 Deals (${deals.length})`]].map(([key, label]) => (
                  <button key={key} onClick={() => setActiveTab(key as any)}
                    style={{ background: 'none', border: 'none', borderBottom: activeTab === key ? `2px solid ${C.coral}` : '2px solid transparent', padding: '10px 18px', fontSize: 13, fontWeight: activeTab === key ? 600 : 400, color: activeTab === key ? C.coral : '#666', cursor: 'pointer', marginBottom: -1 }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>AI Intelligence Brief</div>
                    <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0 }}>{selected.ai_brief}</p>
                  </div>
                  <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Cuisine tags</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                      {(selected.cuisine_tags ?? []).map(t => (
                        <span key={t} style={{ background: '#FEF0EA', color: C.coral, fontSize: 12, padding: '4px 12px', borderRadius: 10, fontWeight: 500 }}>{t}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                      {[
                        ['Status',         selected.status],
                        ['Open until',     selected.open_until ?? '—'],
                        ['Peak hours',     selected.peak_hours ?? '—'],
                        ['Avg spend',      `₹${selected.avg_spend}`],
                        ['Active deals',   stats.activeDeals],
                        ['Influencer posts', stats.totalPosts],
                      ].map(([l, v]) => (
                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f0eb', paddingBottom: 6 }}>
                          <span style={{ color: '#888' }}>{l}</span>
                          <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* INFLUENCERS TAB */}
              {activeTab === 'influencers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>No influencer posts yet for this restaurant.</div>
                  ) : posts.map(p => {
                    const inf = (p as any).influencer
                    return (
                      <div key={p.id} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FEF0EA', color: C.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                          {inf?.avatar_initials ?? '?'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{inf?.name}</span>
                            <span style={{ fontSize: 11, color: '#888' }}>{inf?.handle}</span>
                            <span style={{ fontSize: 11, background: '#FEF0EA', color: C.coral, padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>{inf?.impact_score}% impact</span>
                          </div>
                          <p style={{ fontSize: 13, color: '#555', marginBottom: 10, lineHeight: 1.5 }}>{p.caption}</p>
                          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#888' }}>
                            <span>👁 {p.views.toLocaleString()}</span>
                            <span>❤️ {p.likes.toLocaleString()}</span>
                            <span>💬 {p.comments.toLocaleString()}</span>
                            <span style={{ color: C.green, fontWeight: 600 }}>🚶 {p.visits_driven} visits driven</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* DEALS TAB */}
              {activeTab === 'deals' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                  {deals.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#aaa' }}>No active deals. Create one to drive footfall.</div>
                  ) : deals.map(d => (
                    <div key={d.id} style={{ background: '#FEF0EA', border: '1px solid #f5d5c0', borderRadius: 14, padding: 18 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{d.title}</div>
                      <p style={{ fontSize: 13, color: '#555', marginBottom: 10 }}>{d.description}</p>
                      <div style={{ fontWeight: 700, color: C.coral, fontSize: 13, marginBottom: 6 }}>{d.savings_label}</div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, background: '#fff', borderRadius: 8, padding: '5px 10px', display: 'inline-block', color: C.coral, letterSpacing: 1 }}>{d.code}</div>
                      {d.expires_at && <div style={{ fontSize: 11, color: '#888', marginTop: 8 }}>Expires: {new Date(d.expires_at).toLocaleDateString('en-IN')}</div>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
