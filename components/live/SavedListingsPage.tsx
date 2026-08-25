'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { PageLoader } from '@/components/Skeleton'
import { supabase } from '@/lib/supabase'

const C = { coral: '#E85D26', border: '#ede8e2' }

export default function SavedListingsPage() {
  const [saved, setSaved]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId]   = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      setUserId(user.id)
      supabase
        .from('saved_listings')
        .select('*, restaurant:restaurants(id,slug,name,emoji,area_label,price_tier,rating,intelligence_score,status,cuisine_tags)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => { setSaved(data ?? []); setLoading(false) })
    })
  }, [])

  async function unsave(id: string) {
    await (supabase as any).from('saved_listings').delete().eq('id', id)
    setSaved(prev => prev.filter(s => s.id !== id))
  }

  if (loading) return <><Nav /><PageLoader /></>

  if (!userId) return (
    <div style={{ fontFamily: "-apple-system,sans-serif", background: '#fafafa', minHeight: '100vh' }}>
      <Nav />
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sign in to view saved listings</h2>
        <Link href="/auth/signin?next=/dashboard/saved" style={{ background: C.coral, color: '#fff', borderRadius: 24, padding: '10px 24px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: "-apple-system,sans-serif", background: '#fafafa', minHeight: '100vh', color: '#1a1a1a' }}>
      <Nav />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>❤️ Saved listings</h1>
            <p style={{ fontSize: 14, color: '#888', marginTop: 4 }}>{saved.length} saved restaurant{saved.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/restaurants" style={{ fontSize: 13, color: C.coral, textDecoration: 'none' }}>Browse more →</Link>
        </div>

        {saved.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No saved restaurants yet</h3>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>Tap the ❤️ on any restaurant to save it here.</p>
            <Link href="/restaurants" style={{ background: C.coral, color: '#fff', borderRadius: 24, padding: '10px 24px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Explore restaurants</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {saved.map(s => {
              const r = s.restaurant
              if (!r) return null
              return (
                <div key={s.id} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
                  <button onClick={() => unsave(s.id)}
                    style={{ position: 'absolute', top: 10, right: 10, background: '#fff', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, boxShadow: '0 2px 8px rgba(0,0,0,.1)', zIndex: 1 }}>
                    ❤️
                  </button>
                  <div style={{ height: 80, background: '#FEF0EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>{r.emoji}</div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>📍 {r.area_label} · {r.price_tier}</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                      {r.cuisine_tags?.slice(0, 3).map((t: string) => (
                        <span key={t} style={{ fontSize: 10, background: '#f5f0eb', color: '#666', padding: '2px 8px', borderRadius: 8 }}>{t}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>⭐ {r.rating}</span>
                      <Link href={`/restaurants/${r.slug}`} style={{ background: C.coral, color: '#fff', borderRadius: 12, padding: '5px 12px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>View →</Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
