'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { PageLoader } from '@/components/Skeleton'
import { getInfluencerBySlug, getInfluencerPosts, submitConnectionRequest, getInfluencers } from '@/lib/queries'
import type { Influencer, InfluencerRestaurantPost } from '@/types/database'

const C = { coral: '#E85D26', gold: '#F5A623', green: '#2E9E55', border: '#ede8e2' }

export default function InfluencerProfileLive({ slug }: { slug: string }) {
  const [influencer, setInfluencer] = useState<Influencer | null>(null)
  const [posts, setPosts] = useState<InfluencerRestaurantPost[]>([])
  const [allInfluencers, setAllInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'pricing' | 'connect'>('overview')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ restaurant_name: '', requester_name: '', collab_interest: '' })
  const [submitted, setSubmitted] = useState(false)
  const [following, setFollowing] = useState(false)

  useEffect(() => {
    Promise.all([
      getInfluencerBySlug(slug),
      getInfluencers({ limit: 5, offset: 0 }),
    ]).then(async ([inf, { data: all }]) => {
      setInfluencer(inf)
      setAllInfluencers(all.filter(i => i.slug !== slug).slice(0, 4))
      if (inf) {
        const posts = await getInfluencerPosts(inf.id, 5)
        setPosts(posts)
      }
      setLoading(false)
    })
  }, [slug])

  const handleConnect = async () => {
    if (!influencer) return
    await submitConnectionRequest({
      influencer_id: influencer.id,
      restaurant_name: form.restaurant_name,
      requester_name: form.requester_name,
      collab_interest: form.collab_interest,
    })
    setSubmitted(true)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 80, fontFamily: 'sans-serif', color: '#aaa' }}>Loading…</div>
  if (!influencer) return <div style={{ textAlign: 'center', padding: 80, fontFamily: 'sans-serif', color: '#aaa' }}>Influencer not found.</div>

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'overview', label: '📊 Overview'   },
    { key: 'posts',    label: `📸 Posts (${posts.length})` },
    { key: 'pricing',  label: '💰 Pricing'    },
    { key: 'connect',  label: '🤝 Connect'    },
  ]

  return (
    <div style={{ fontFamily: "-apple-system,sans-serif", background: '#fafafa', minHeight: '100vh', color: '#1a1a1a' }}>
      <Nav />

      {/* HERO */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 0' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20 }}>
            {/* Avatar */}
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#FEF0EA', color: C.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, border: `3px solid ${C.coral}`, flexShrink: 0 }}>
              {influencer.avatar_initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{influencer.name}</h1>
                <span style={{ fontSize: 12, background: '#FEF0EA', color: C.coral, padding: '3px 10px', borderRadius: 10, fontWeight: 600 }}>
                  #{influencer.rank_this_week ?? '—'} this week
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{influencer.handle} · {influencer.platform}</div>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, margin: '0 0 12px' }}>{influencer.bio}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(influencer.cuisine_tags ?? []).map(t => (
                  <span key={t} style={{ fontSize: 11, background: '#f5f0eb', color: '#666', padding: '2px 8px', borderRadius: 8 }}>{t}</span>
                ))}
              </div>
            </div>
            {/* Stats block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => setFollowing(f => !f)}
                style={{ background: following ? '#f0ebe5' : C.coral, color: following ? '#666' : '#fff', border: `1px solid ${following ? C.border : C.coral}`, borderRadius: 20, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {following ? '✓ Following' : '+ Follow'}
              </button>
              <button
                onClick={() => setShowModal(true)}
                style={{ background: '#fff', color: C.coral, border: `1px solid ${C.coral}`, borderRadius: 20, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Connect
              </button>
            </div>
          </div>

          {/* Key metrics row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 1, background: C.border, borderRadius: 12, overflow: 'hidden', marginBottom: 0 }}>
            {[
              { val: `${((influencer.followers_count ?? 0) / 1000).toFixed(0)}K`, label: 'Followers' },
              { val: `${influencer.impact_score ?? 0}%`, label: 'Impact score' },
              { val: `${influencer.engagement_rate ?? 0}%`, label: 'Engagement' },
              { val: `${influencer.trust_score ?? 0}%`, label: 'Trust score' },
              { val: influencer.visits_driven_weekly ?? 0, label: 'Visits/week' },
            ].map(m => (
              <div key={m.label} style={{ background: '#fff', padding: '14px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{m.val}</div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 3 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderTop: `1px solid ${C.border}`, marginTop: 16 }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ background: 'none', border: 'none', borderBottom: activeTab === t.key ? `2px solid ${C.coral}` : '2px solid transparent', padding: '12px 20px', fontSize: 13, fontWeight: activeTab === t.key ? 600 : 400, color: activeTab === t.key ? C.coral : '#666', cursor: 'pointer', marginBottom: -1 }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Performance bars</div>
              {[
                { label: 'Visit conversion', val: influencer.impact_score ?? 0, color: C.coral },
                { label: 'Audience trust',   val: influencer.trust_score ?? 0,  color: C.gold },
                { label: 'Engagement rate',  val: Math.round((influencer.engagement_rate ?? 0) * 5), color: C.green },
                { label: 'Content quality',  val: 88, color: '#7F77DD' },
              ].map(b => (
                <div key={b.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: '#666' }}>{b.label}</span>
                    <span style={{ fontWeight: 600, color: b.color }}>{b.val}%</span>
                  </div>
                  <div style={{ height: 6, background: '#f0ebe5', borderRadius: 4 }}>
                    <div style={{ height: '100%', borderRadius: 4, background: b.color, width: `${b.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Creator details</div>
              {[
                { label: 'Platform',        val: influencer.platform },
                { label: 'Response time',   val: influencer.response_time_label ?? '—' },
                { label: 'Fake followers',  val: `${influencer.fake_follower_pct ?? 0}%` },
                { label: 'Avg views',       val: `${((influencer.avg_views ?? 0) / 1000).toFixed(0)}K` },
                { label: 'Active cities',   val: (influencer.active_cities ?? []).join(', ') || '—' },
                { label: 'Connection fee',  val: `₹${(influencer.connection_fee ?? 0).toLocaleString()}` },
              ].map(d => (
                <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid #f5f0eb`, fontSize: 13 }}>
                  <span style={{ color: '#888' }}>{d.label}</span>
                  <span style={{ fontWeight: 500 }}>{d.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* POSTS */}
        {activeTab === 'posts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>No posts recorded yet.</div>
            ) : posts.map(p => {
              const rest = (p as any).restaurant
              return (
                <div key={p.id} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>{rest?.emoji ?? '🍽️'}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{rest?.name ?? 'Restaurant'}</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{rest?.area_label}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: 11, color: '#aaa' }}>
                      {new Date(p.posted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: '#555', marginBottom: 12, lineHeight: 1.5 }}>{p.caption}</p>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#888' }}>
                    <span>👁 {p.views.toLocaleString()}</span>
                    <span>❤️ {p.likes.toLocaleString()}</span>
                    <span>💬 {p.comments.toLocaleString()}</span>
                    <span style={{ color: C.green, fontWeight: 600 }}>🚶 {p.visits_driven} visits</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* PRICING */}
        {activeTab === 'pricing' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {(influencer.pricing_tiers ?? []).length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#aaa' }}>No pricing listed yet.</div>
            ) : (influencer.pricing_tiers ?? []).map(tier => (
              <div key={tier.id} style={{ background: tier.is_popular ? '#FEF9F6' : '#fff', border: `1px solid ${tier.is_popular ? C.coral : C.border}`, borderRadius: 14, padding: 20, position: 'relative' }}>
                {tier.is_popular && (
                  <span style={{ position: 'absolute', top: -10, left: 16, background: C.coral, color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 10px', borderRadius: 10 }}>Most popular</span>
                )}
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{tier.tier_name}</div>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 14, lineHeight: 1.5 }}>{tier.description}</p>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.coral }}>₹{tier.price.toLocaleString()}</div>
                <button
                  onClick={() => { setActiveTab('connect'); setShowModal(true) }}
                  style={{ marginTop: 14, width: '100%', background: tier.is_popular ? C.coral : '#fff', color: tier.is_popular ? '#fff' : C.coral, border: `1px solid ${C.coral}`, borderRadius: 20, padding: '8px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Book this
                </button>
              </div>
            ))}
          </div>
        )}

        {/* CONNECT */}
        {activeTab === 'connect' && (
          <div style={{ maxWidth: 500, margin: '0 auto', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Connect with {influencer.name}</div>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 20, lineHeight: 1.5 }}>
              {influencer.response_time_label ?? 'Usually responds within a few days'}. One-time connection fee: <strong style={{ color: C.coral }}>₹{(influencer.connection_fee ?? 0).toLocaleString()}</strong>
            </p>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: 30 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Request sent!</div>
                <p style={{ fontSize: 13, color: '#888' }}>We&apos;ll introduce you to {influencer.name} within 24 hours.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { field: 'restaurant_name', label: 'Your restaurant name', placeholder: 'e.g. Dum Biryani House' },
                  { field: 'requester_name',  label: 'Your name',            placeholder: 'e.g. Priya Sharma' },
                  { field: 'collab_interest', label: 'What kind of collab?', placeholder: 'e.g. Reel review of our new menu' },
                ].map(f => (
                  <div key={f.field}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input
                      value={(form as any)[f.field]}
                      onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                ))}
                <button
                  onClick={handleConnect}
                  disabled={!form.restaurant_name || !form.requester_name}
                  style={{ background: C.coral, color: '#fff', border: 'none', borderRadius: 24, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: (!form.restaurant_name || !form.requester_name) ? 0.5 : 1 }}
                >
                  Send connection request · ₹{(influencer.connection_fee ?? 0).toLocaleString()}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONNECT MODAL */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, padding: 28, width: 380, maxWidth: '90vw' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Connect with {influencer.name}</div>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 20, lineHeight: 1.5 }}>
              Fee of <strong style={{ color: C.coral }}>₹{(influencer.connection_fee ?? 0).toLocaleString()}</strong> only charged on acceptance.
            </p>
            <button onClick={() => { setShowModal(false); setActiveTab('connect') }}
              style={{ width: '100%', background: C.coral, color: '#fff', border: 'none', borderRadius: 24, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Fill connection form →
            </button>
            <button onClick={() => setShowModal(false)}
              style={{ width: '100%', background: 'none', border: 'none', color: '#aaa', fontSize: 13, marginTop: 10, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    
      <Footer />
    </div>
  )
}