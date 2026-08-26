'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

const C = { coral: '#E85D26', purple: '#7F77DD', border: '#ede8e2', green: '#2E9E55' }

export default function InfluencerDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [posts,   setPosts]   = useState<any[]>([])
  const [listingId, setListingId] = useState<string | null>(null)
  const [requests, setRequests]   = useState<any[]>([])
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadRequests(infId: string) {
    const { data } = await (supabase as any)
      .from('connection_requests')
      .select('id,restaurant_name,requester_name,collab_interest,status,created_at')
      .eq('influencer_id', infId)
      .order('created_at', { ascending: false })
      .limit(20)
    setRequests(data ?? [])
  }

  async function respond(id: string, status: 'accepted' | 'declined') {
    setRespondingId(id)
    const { error } = await (supabase as any).from('connection_requests').update({ status }).eq('id', id)
    setRespondingId(null)
    if (!error) setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/signin'); return }
      const { data: p } = await (supabase as any).from('profiles').select('id,full_name,role,instagram_handle,avatar_url,content_types,audience_size_range,preferred_cuisines').eq('id', user.id).single()
      if (!p || p.role !== 'influencer') { router.push('/dashboard'); return }
      setProfile(p)
      // NOTE: this used to match on influencers.instagram_handle, a column
      // that doesn't exist on that table (it's called `handle`) — the query
      // always errored and silently returned nothing, so posts/requests
      // never loaded for ANY influencer. profile_id is the real, reliable
      // link between an account and its public creator listing.
      const { data: inf } = await (supabase as any)
        .from('influencers')
        .select('id,slug,name,followers_count,impact_score,visits_driven_weekly,rank_this_week,listing_status')
        .eq('profile_id', user.id).maybeSingle()
      if (inf) {
        setListingId(inf.id)
        setProfile((prev: any) => ({ ...prev, ...inf }))
        const [{ data: infPosts }] = await Promise.all([
          (supabase as any).from('influencer_restaurant_posts').select('id,views,likes,comments,visits_driven,posted_at,caption,restaurant:restaurants(id,name,emoji)').eq('influencer_id', inf.id).order('posted_at', { ascending: false }).limit(10),
          loadRequests(inf.id),
        ])
        setPosts(infPosts ?? [])
      }
      setLoading(false)
    })
  }, [router])

  if (loading) return (<div style={{ minHeight:'100vh', fontFamily:'-apple-system,sans-serif' }}><Nav /><div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'#aaa' }}>Loading dashboard…</div></div>)

  const totalViews    = posts.reduce((s, p) => s + (p.views ?? 0), 0)
  const totalVisits   = posts.reduce((s, p) => s + (p.visits_driven ?? 0), 0)
  const totalEngaged  = posts.reduce((s, p) => s + (p.likes ?? 0) + (p.comments ?? 0), 0)
  const avgEngagement = totalViews > 0 ? ((totalEngaged / totalViews) * 100).toFixed(1) : '0.0'
  const initials      = (profile.full_name || 'I').charAt(0).toUpperCase()
  // Was `(n/1000).toFixed(0)+'K'` — for any real (non-zero) count under 1000
  // that rounds to "0K", which reads exactly like zero. Show the raw number
  // below 1000, same as the Analytics page's own fmt().
  const fmtCount = (n: number) => n <= 0 ? '—' : n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n)

  return (
    <div style={{ fontFamily:'-apple-system,sans-serif', background:'#fafafa', minHeight:'100vh', color:'#1a1a1a' }}>
      <Nav />
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 24px' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <div style={{ fontSize:22, fontWeight:700 }}>✨ Creator Dashboard</div>
            <div style={{ fontSize:13, color:'#888', marginTop:3 }}>Welcome back, {profile.full_name?.split(' ')[0] ?? 'creator'}</div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <Link href="/account" style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 16px', fontSize:13, color:'#555', textDecoration:'none' }}>Edit profile</Link>
          <Link href="/dashboard/influencer/analytics" style={{ background:C.purple, border:'none', borderRadius:10, padding:'8px 16px', fontSize:13, color:'#fff', textDecoration:'none', fontWeight:600 }}>📊 Analytics</Link>
            {/* Used to link to /u/[id] — a route that only exists for a
                different "generic user profile" concept and doesn't exist
                for influencers, so this always 404'd. A creator's real
                public page is /influencers/[slug]; only show the button
                once that listing (and its slug) actually exists. */}
            {profile.slug && (
              <Link href={`/influencers/${profile.slug}`} style={{ background:C.purple, color:'#fff', borderRadius:10, padding:'8px 16px', fontSize:13, textDecoration:'none', fontWeight:600 }}>View public profile</Link>
            )}
          </div>
        </div>

        {/* Profile summary */}
        <div style={{ background:'linear-gradient(135deg,#2a1a40,#3d2a60)', borderRadius:16, padding:24, marginBottom:20, color:'#fff' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:C.purple, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, border:'2px solid rgba(255,255,255,.3)' }}>{initials}</div>
            <div>
              <div style={{ fontSize:18, fontWeight:700 }}>{profile.full_name}</div>
              {profile.instagram_handle && <div style={{ fontSize:13, color:'rgba(255,255,255,.7)' }}>@{profile.instagram_handle}</div>}
              <div style={{ fontSize:12, color:'rgba(255,255,255,.6)', marginTop:4 }}>{profile.audience_size_range ?? 'micro'} creator · {(profile.content_types ?? []).slice(0,2).join(' · ')}</div>
            </div>
          </div>
        </div>

        {!listingId && (
          <div role="alert" style={{ background:'#FEF9F6', border:'1px solid #f5d5c0', borderRadius:14, padding:'14px 18px', marginBottom:20, fontSize:13, color:'#555', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
            <span>You don't have a public creator listing yet — restaurants can't discover you or send collaboration requests until you complete it.</span>
            <Link href="/account" style={{ background:C.purple, color:'#fff', borderRadius:10, padding:'8px 18px', fontSize:12, textDecoration:'none', fontWeight:600, whiteSpace:'nowrap' }}>Complete creator profile →</Link>
          </div>
        )}
        {listingId && profile.listing_status === 'pending_review' && (
          <div role="status" style={{ background:'#FEF9EA', border:'1px solid #f5e3a8', borderRadius:14, padding:'12px 18px', marginBottom:20, fontSize:13, color:'#8a6d10' }}>
            ⏳ Your creator listing is pending admin review — once approved, you'll be visible in the public directory and restaurants can send you requests.
          </div>
        )}
        {listingId && profile.listing_status === 'rejected' && (
          <div role="alert" style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:14, padding:'12px 18px', marginBottom:20, fontSize:13, color:'#dc2626' }}>
            Your creator listing was not approved. <Link href="/account" style={{ color:'#dc2626', fontWeight:600 }}>Update your profile</Link> and it will be resubmitted for review.
          </div>
        )}

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
          {[
            { icon:'👁️', val: fmtCount(totalViews), label:'Total views' },
            { icon:'🚶', val: totalVisits > 0 ? totalVisits.toLocaleString('en-IN') : '—', label:'Visits driven' },
            { icon:'📊', val: avgEngagement+'%', label:'Avg engagement' },
            { icon:'🏆', val: profile.rank_this_week ? `#${profile.rank_this_week}` : '—', label:'Platform rank' },
          ].map(k => (
            <div key={k.label} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:'16px 18px' }}>
              <div style={{ fontSize:22 }}>{k.icon}</div>
              <div style={{ fontSize:24, fontWeight:700, color:C.purple, marginTop:8 }}>{k.val}</div>
              <div style={{ fontSize:12, color:'#888', marginTop:4 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {/* Recent posts */}
          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
            <h3 style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>📸 Recent posts</h3>
            {posts.length === 0 ? (
              <div style={{ textAlign:'center', padding:24, color:'#aaa' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📸</div>
                <p style={{ fontSize:13 }}>No posts tracked yet. When restaurants add your content, it will appear here.</p>
              </div>
            ) : posts.map(p => (
              <div key={p.id} style={{ display:'flex', gap:12, padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
                <div style={{ width:40, height:40, borderRadius:10, background:'#FEF0EA', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{p.restaurant?.emoji ?? '🍽️'}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{p.restaurant?.name}</div>
                  <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>
                    👁️ {fmtCount(p.views ?? 0)} · 🚶 {p.visits_driven ?? 0} visits · {new Date(p.posted_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Collaboration requests — restaurants that clicked "Connect"
              on this creator's public profile (migration_015). */}
          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
            <h3 style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>🤝 Collaboration requests</h3>
            {requests.length === 0 ? (
              <div style={{ textAlign:'center', padding:24, color:'#aaa' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🤝</div>
                <p style={{ fontSize:13, marginBottom:12 }}>No collaboration requests yet. Complete your profile to attract restaurant partnerships.</p>
                <Link href="/account" style={{ background:C.purple, color:'#fff', borderRadius:10, padding:'8px 20px', fontSize:12, textDecoration:'none', fontWeight:600 }}>Complete profile</Link>
              </div>
            ) : requests.map(r => (
              <div key={r.id} style={{ padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{r.restaurant_name}</div>
                    <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>from {r.requester_name} · {new Date(r.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</div>
                    {r.collab_interest && <div style={{ fontSize:12, color:'#666', marginTop:6 }}>{r.collab_interest}</div>}
                  </div>
                  <span style={{
                    fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:10, flexShrink:0, textTransform:'capitalize',
                    background: r.status==='accepted' ? '#EAF8EE' : r.status==='declined' ? '#f5f5f5' : '#FEF9EA',
                    color: r.status==='accepted' ? C.green : r.status==='declined' ? '#888' : '#D4860A',
                  }}>{r.status}</span>
                </div>
                {r.status === 'pending' && (
                  <div style={{ display:'flex', gap:8, marginTop:10 }}>
                    <button onClick={() => respond(r.id, 'accepted')} disabled={respondingId===r.id}
                      style={{ background:'#EAF8EE', color:C.green, border:'none', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer', opacity:respondingId===r.id?0.6:1 }}>Accept</button>
                    <button onClick={() => respond(r.id, 'declined')} disabled={respondingId===r.id}
                      style={{ background:'#fef2f2', color:'#dc2626', border:'none', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer', opacity:respondingId===r.id?0.6:1 }}>Decline</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
