'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

const C = { coral: '#E85D26', gold: '#F5A623', green: '#2E9E55', amber: '#D4860A', border: '#ede8e2' }

export default function DealsPage() {
  const [deals, setDeals]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(supabase as any)
      .from('deals')
      .select('id,title,description,discount_pct,valid_until,deal_type,restaurant:restaurants(id,slug,name,emoji,area_label,price_tier,listing_status)')
      .order('created_at',{ascending:false})
      .limit(20)
      .then(({ data }: any) => {
        setDeals((data ?? []).filter((d: any) => d.restaurant?.listing_status === 'approved'))
        setLoading(false)
      })
  }, [])

  const today    = new Date()
  const isActive = (d: any) => !d.valid_until || new Date(d.valid_until) >= today
  const active   = deals.filter(isActive)
  const expired  = deals.filter(d => !isActive(d))

  const DealCard = ({ d }: { d: any }) => (
    <Link href={`/restaurants/${d.restaurant?.slug}`} style={{ textDecoration:'none', color:'inherit' }}>
      <div style={{ background:'#fff', border:`2px solid ${C.amber}22`, borderRadius:16, overflow:'hidden', opacity: isActive(d) ? 1 : 0.6 }}>
        <div style={{ background:`linear-gradient(135deg,${C.amber}18,${C.gold}18)`, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:32 }}>{d.restaurant?.emoji || '🍽️'}</span>
            <div>
              <div style={{ fontSize:14, fontWeight:700 }}>{d.restaurant?.name}</div>
              <div style={{ fontSize:12, color:'#888' }}>📍 {d.restaurant?.area_label}</div>
            </div>
          </div>
          {d.discount_pct && (
            <div style={{ background:C.amber, color:'#fff', fontWeight:800, fontSize:18, borderRadius:12, padding:'6px 14px', textAlign:'center' }}>
              {d.discount_pct}%<div style={{ fontSize:9, fontWeight:400 }}>OFF</div>
            </div>
          )}
        </div>
        <div style={{ padding:'14px 20px' }}>
          <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{d.title}</div>
          {d.description && <div style={{ fontSize:12, color:'#888', marginBottom:10 }}>{d.description}</div>}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, color: isActive(d) ? C.green : '#dc2626', fontWeight:600 }}>
              {isActive(d) ? '✓ Active' : '✗ Expired'}
            </span>
            {d.valid_until && (
              <span style={{ fontSize:11, color:'#aaa' }}>
                Until {new Date(d.valid_until).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )

  return (
    <div style={{ fontFamily:'-apple-system,sans-serif', background:'#fafafa', minHeight:'100vh' }}>
      <Nav />
      <div style={{ background:`linear-gradient(135deg,${C.amber},${C.gold})`, padding:'32px 24px 28px', color:'#fff' }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          <h1 style={{ fontSize:28, fontWeight:800, margin:0 }}>🏷️ Deals & Offers</h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,.8)', marginTop:6 }}>Best food deals in Bengaluru today</p>
          <div style={{ marginTop:16, fontSize:13, background:'rgba(255,255,255,.2)', display:'inline-block', padding:'6px 14px', borderRadius:20 }}>
            {active.length} active deal{active.length !== 1 ? 's' : ''} right now
          </div>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'24px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>Loading deals…</div>
        ) : deals.length === 0 ? (
          <div style={{ textAlign:'center', padding:60 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🏷️</div>
            <h2 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>No deals yet</h2>
            <p style={{ fontSize:14, color:'#888', marginBottom:20 }}>Restaurant owners can add deals from their dashboard.</p>
            <Link href="/restaurants" style={{ background:C.coral, color:'#fff', padding:'10px 24px', borderRadius:20, textDecoration:'none', fontSize:14, fontWeight:600 }}>Browse restaurants →</Link>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <h2 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>🟢 Active now</h2>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16, marginBottom:32 }}>
                  {active.map(d => <DealCard key={d.id} d={d} />)}
                </div>
              </>
            )}
            {expired.length > 0 && (
              <>
                <h2 style={{ fontSize:16, fontWeight:700, marginBottom:16, color:'#aaa' }}>⏰ Recently expired</h2>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
                  {expired.map(d => <DealCard key={d.id} d={d} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
