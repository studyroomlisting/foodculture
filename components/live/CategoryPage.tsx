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

export default function CategoryPage({ slug }: { slug: string }) {
  const [category, setCategory] = useState<any>(null)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: cat } = await (supabase as any).from('categories').select('*').eq('slug', slug).single()
      setCategory(cat)
      if (cat) {
        const { data: rc } = await supabase
          .from('restaurant_categories')
          .select('restaurant_id')
          .eq('category_id', cat.id)
        const ids = (rc as any[])?.map((r: any) => r.restaurant_id) ?? []
        if (ids.length > 0) {
          const { data: rests } = await supabase
            .from('restaurants')
            .select('*, zone:zones(*)')
            .in('id', ids)
            .eq('listing_status', 'approved')
            .order('intelligence_score', { ascending: false })
          setRestaurants(rests ?? [])
        } else {
          // Fallback: filter by cuisine_tags
          const { data: rests } = await supabase
            .from('restaurants')
            .select('*, zone:zones(*)')
            .contains('cuisine_tags', [cat.name])
            .order('intelligence_score', { ascending: false })
          setRestaurants(rests ?? [])
        }
      }
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return <><Nav /><PageLoader /></>
  if (!category) return <><Nav /><div style={{ textAlign: 'center', padding: 80, color: '#aaa' }}>Category not found.</div><Footer /></>

  const STATUS_COLOR: Record<string, string> = { viral: '#E85D26', rising: '#2E9E55', new: '#D4860A', active: '#888' }

  return (
    <div style={{ fontFamily: "-apple-system,sans-serif", background: '#fafafa', minHeight: '100vh', color: '#1a1a1a' }}>
      <Nav />

      {/* Breadcrumb + header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <nav style={{ fontSize: 13, color: '#888', padding: '14px 0 0', display: 'flex', gap: 6, alignItems: 'center' }}>
            <Link href="/" style={{ color: '#888', textDecoration: 'none' }}>Home</Link>
            <span style={{ color: '#ccc' }}>›</span>
            <Link href="/restaurants" style={{ color: '#888', textDecoration: 'none' }}>Restaurants</Link>
            <span style={{ color: '#ccc' }}>›</span>
            <span style={{ color: '#1a1a1a', fontWeight: 500 }}>{category.name}</span>
          </nav>
          <div style={{ padding: '20px 0 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 48 }}>{category.emoji}</span>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px' }}>{category.name} in Bengaluru</h1>
              <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
                {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} · {category.description}
              </p>
            </div>
          </div>
          {/* All categories quick nav */}
          <AllCategoriesNav currentSlug={slug} />
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
        {restaurants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{category.emoji}</div>
            <p>No restaurants listed in this category yet.</p>
            <Link href="/restaurants" style={{ color: C.coral, textDecoration: 'none', fontSize: 14 }}>Browse all restaurants →</Link>
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

function AllCategoriesNav({ currentSlug }: { currentSlug: string }) {
  const [cats, setCats] = useState<any[]>([])
  useEffect(() => { (supabase as any).from('categories').select('*').order('restaurant_count', { ascending: false }).then(({ data }) => setCats(data ?? [])) }, [])
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 16 }}>
      {cats.map(c => (
        <Link key={c.id} href={`/categories/${c.slug}`}
          style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, textDecoration: 'none', background: c.slug === currentSlug ? C.coral : '#f5f0eb', color: c.slug === currentSlug ? '#fff' : '#666', fontWeight: c.slug === currentSlug ? 600 : 400 }}>
          {c.emoji} {c.name}
        </Link>
      ))}
    </div>
  )
}
