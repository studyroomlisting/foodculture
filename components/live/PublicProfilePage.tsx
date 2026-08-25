'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

const C = { coral: '#E85D26', border: '#ede8e2', green: '#2E9E55', purple: '#7F77DD' }

export default function PublicProfilePage({ username }: { username: string }) {
  const [profile, setProfile] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data: p } = await (supabase as any)
        .from('profiles')
        .select('id,full_name,username,bio,city,state,country,role,avatar_url,preferred_cuisines,instagram_handle,profile_public,created_at')
        .ilike('username', username)
        .single()

      if (!p || !p.profile_public) { setNotFound(true); setLoading(false); return }
      setProfile(p)

      const { data: rv } = await (supabase as any)
        .from('reviews')
        .select('id,rating,body,created_at,restaurant:restaurants(id,slug,name,emoji)')
        .eq('reviewer_id', p.id)
        .order('created_at', { ascending: false })
        .limit(5)
      setReviews(rv ?? [])
      setLoading(false)
    })()
  }, [username])

  if (loading) return (
    <div style={{ minHeight:'100vh', fontFamily:'-apple-system,sans-serif' }}>
      <Nav />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'#aaa' }}>Loading profile…</div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight:'100vh', fontFamily:'-apple-system,sans-serif' }}>
      <Nav />
      <div style={{ maxWidth:480, margin:'80px auto', textAlign:'center', padding:'0 24px' }}>
        <div style={{ fontSize:52, marginBottom:16 }}>🔍</div>
        <h1 style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Profile not found</h1>
        <p style={{ fontSize:14, color:'#888', marginBottom:20 }}>@{username} doesn't exist or has a private profile.</p>
        <Link href="/" style={{ color:C.coral, textDecoration:'none', fontSize:14 }}>← Back to home</Link>
      </div>
    </div>
  )

  const initials = (profile.full_name || profile.username || 'U').charAt(0).toUpperCase()
  const roleLabel = profile.role === 'owner' ? '🏪 Restaurant owner' : profile.role === 'influencer' ? '✨ Food creator' : '🍽️ Food explorer'
  const joinDate = new Date(profile.created_at).toLocaleDateString('en-IN', { month:'long', year:'numeric' })

  return (
    <div style={{ fontFamily:'-apple-system,sans-serif', background:'#fafafa', minHeight:'100vh', color:'#1a1a1a' }}>
      <Nav />
      <div style={{ maxWidth:760, margin:'0 auto', padding:'40px 24px' }}>
        {/* Profile card */}
        <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:20, overflow:'hidden', marginBottom:20 }}>
          <div style={{ height:100, background:'linear-gradient(135deg,#1a0800,#2d1200)' }} />
          <div style={{ padding:'0 28px 28px', marginTop:-36 }}>
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ width:72, height:72, borderRadius:'50%', background:profile.role==='influencer'?'#7F77DD':C.coral, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:700, border:'3px solid #fff' }}>
                {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} /> : initials}
              </div>
              {profile.instagram_handle && (
                <a href={`https://instagram.com/${profile.instagram_handle.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:6, background:'#f5f0ea', border:`1px solid ${C.border}`, borderRadius:20, padding:'7px 14px', fontSize:12, color:'#555', textDecoration:'none' }}>
                  📸 @{profile.instagram_handle.replace('@','')}
                </a>
              )}
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>{profile.full_name}</h1>
            {profile.username && <div style={{ fontSize:13, color:'#888', marginBottom:8 }}>@{profile.username}</div>}
            <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#f5f5f5', borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:600, color:'#555', marginBottom:12 }}>
              {roleLabel}
            </div>
            {profile.bio && <p style={{ fontSize:14, color:'#555', lineHeight:1.7, marginBottom:12 }}>{profile.bio}</p>}
            <div style={{ display:'flex', gap:16, fontSize:12, color:'#888', flexWrap:'wrap' }}>
              {(profile.city || profile.country) && <span>📍 {[profile.city, profile.country].filter(Boolean).join(', ')}</span>}
              <span>📅 Joined {joinDate}</span>
            </div>
            {profile.preferred_cuisines?.length > 0 && (
              <div style={{ marginTop:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>Favourite cuisines</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {profile.preferred_cuisines.map((c: string) => (
                    <span key={c} style={{ background:'#FEF0EA', color:C.coral, fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding:24 }}>
            <h2 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>⭐ Recent reviews</h2>
            {reviews.map((rv: any) => (
              <div key={rv.id} style={{ padding:'14px 0', borderBottom:`1px solid ${C.border}` }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                  <Link href={`/restaurants/${rv.restaurant?.slug}`} style={{ fontSize:14, fontWeight:700, color:'#1a1a1a', textDecoration:'none' }}>
                    {rv.restaurant?.emoji} {rv.restaurant?.name}
                  </Link>
                  <div style={{ fontSize:13, color:'#F5A623' }}>{'★'.repeat(rv.rating)}{'☆'.repeat(5-rv.rating)}</div>
                </div>
                <p style={{ fontSize:13, color:'#555', margin:0, lineHeight:1.6 }}>{rv.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
