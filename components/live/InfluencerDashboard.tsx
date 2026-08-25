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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/signin'); return }
      const { data: p } = await (supabase as any).from('profiles').select('id,full_name,role,instagram_handle,avatar_url,content_types,audience_size_range,preferred_cuisines').eq('id', user.id).single()
      if (!p || p.role !== 'influencer') { router.push('/dashboard'); return }
      setProfile(p)
      // Load their posts if they're in the influencer_restaurant_posts table
      const { data: inf } = await (supabase as any).from('influencers').select('id,name,followers_count,impact_score,visits_driven_weekly,rank_this_week').ilike('instagram_handle', p.instagram_handle || '__NONE__').single()
      if (inf) {
        const { data: infPosts } = await (supabase as any).from('influencer_restaurant_posts').select('id,views,likes,comments,visits_driven,posted_at,caption,restaurant:restaurants(id,name,emoji)').eq('influencer_id', inf.id).order('posted_at', { ascending: false }).limit(10)
        setPosts(infPosts ?? [])
        setProfile((prev: any) => ({ ...prev, ...inf }))
      }
      setLoading(false)
    })
  }, [router])

  if (loading) return (<div style={{ minHeight:'100vh', fontFamily:'-apple-system,sans-serif' }}><Nav /><div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'#aaa' }}>Loading dashboard…</div></div>)

  const totalViews    = posts.reduce((s, p) => s + (p.views ?? 0), 0)
  const totalVisits   = posts.reduce((s, p) => s + (p.visits_driven ?? 0), 0)
  const avgEngagement = posts.length ? ((posts.reduce((s, p) => s + (p.likes ?? 0) + (p.comments ?? 0), 0) / posts.reduce((s, p) => s + (p.views ?? 1), 1)) * 100).toFixed(1) : '—'
  const initials      = (profile.full_name || 'I').charAt(0).toUpperCase()

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
            <Link href={`/u/${profile.username || profile.id}`} style={{ background:C.purple, color:'#fff', borderRadius:10, padding:'8px 16px', fontSize:13, textDecoration:'none', fontWeight:600 }}>View public profile</Link>
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

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
          {[
            { icon:'👁️', val: totalViews > 0 ? (totalViews/1000).toFixed(0)+'K' : '—', label:'Total views' },
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
                    👁️ {(p.views/1000).toFixed(0)}K · 🚶 {p.visits_driven} visits · {new Date(p.posted_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Collaboration invitations placeholder */}
          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
            <h3 style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>🤝 Collaboration requests</h3>
            <div style={{ textAlign:'center', padding:24, color:'#aaa' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🤝</div>
              <p style={{ fontSize:13, marginBottom:12 }}>No collaboration requests yet. Complete your profile to attract restaurant partnerships.</p>
              <Link href="/account" style={{ background:C.purple, color:'#fff', borderRadius:10, padding:'8px 20px', fontSize:12, textDecoration:'none', fontWeight:600 }}>Complete profile</Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
