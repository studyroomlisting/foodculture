'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import RestaurantCard from '@/components/RestaurantCard'
import Footer from '@/components/Footer'
import { PageLoader } from '@/components/Skeleton'
import { supabase } from '@/lib/supabase'
import type { Restaurant } from '@/types/database'

const C = { coral: '#E85D26', border: '#ede8e2' }

export default function LocationPage({ slug }: { slug: string }) {
  const [location, setLocation] = useState<any>(null)
  const [zone, setZone]         = useState<any>(null)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [nearby, setNearby]     = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const { data: loc } = await (supabase as any).from('locations').select('*, zone:zones(*)').eq('slug', slug).single()
      setLocation(loc)
      if (loc) {
        setZone(loc.zone)
        // Restaurants in this zone that match the area_label
        const { data: rests } = await supabase
          .from('restaurants')
          .select('*, zone:zones(*)')
          .eq('zone_id', loc.zone_id)
          .ilike('area_label', `%${loc.name.split(' ')[0]}%`)
          .order('intelligence_score', { ascending: false })
        setRestaurants(rests ?? [])
        // Other locations in same zone
        const { data: others } = await supabase
          .from('locations')
          .select('*')
          .eq('zone_id', loc.zone_id)
          .neq('slug', slug)
          .limit(4)
        setNearby(others ?? [])
      }
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return <><Nav /><PageLoader /></>
  if (!location) return <><Nav /><div style={{ textAlign: 'center', padding: 80, color: '#aaa' }}>Location not found.</div><Footer /></>

  const STATUS_COLOR: Record<string, string> = { viral: '#E85D26', rising: '#2E9E55', new: '#D4860A', active: '#888' }

  return (
    <div style={{ fontFamily: "-apple-system,sans-serif", background: '#fafafa', minHeight: '100vh', color: '#1a1a1a' }}>
      <Nav />

      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <nav style={{ fontSize: 13, color: '#888', padding: '14px 0 0', display: 'flex', gap: 6, alignItems: 'center' }}>
            <Link href="/" style={{ color: '#888', textDecoration: 'none' }}>Home</Link>
            <span style={{ color: '#ccc' }}>›</span>
            <Link href="/restaurants" style={{ color: '#888', textDecoration: 'none' }}>Restaurants</Link>
            <span style={{ color: '#ccc' }}>›</span>
            <span style={{ color: '#1a1a1a', fontWeight: 500 }}>{location.name}</span>
          </nav>
          <div style={{ padding: '20px 0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 32 }}>📍</span>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px' }}>Restaurants in {location.name}</h1>
                <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
                  {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} · {zone?.name ?? 'Bengaluru'}
                  {zone && <span style={{ marginLeft: 10, background: '#FEF0EA', color: C.coral, fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Zone score: {zone.trend_score}</span>}
                </p>
              </div>
            </div>
            {location.description && <p style={{ fontSize: 14, color: '#666', margin: '0 0 16px' }}>{location.description}</p>}

            {/* Nearby locations */}
            {nearby.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#aaa' }}>Nearby:</span>
                {nearby.map(n => (
                  <Link key={n.id} href={`/locations/${n.slug}`}
                    style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, textDecoration: 'none', background: '#f5f0eb', color: '#666' }}>
                    📍 {n.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
        {restaurants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>
            <p>No restaurants listed for this area yet.</p>
            <Link href="/restaurants" style={{ color: C.coral, textDecoration: 'none', fontSize: 14 }}>Browse all →</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {restaurants.map(r => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
