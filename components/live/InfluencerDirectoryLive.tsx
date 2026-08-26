'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import InfluencerCard from '@/components/InfluencerCard'
import Footer from '@/components/Footer'
import { GridSkeleton } from '@/components/Skeleton'
import { getInfluencers } from '@/lib/queries'
import type { Influencer } from '@/types/database'

const PAGE_SIZE = 12
const C = { coral:'#E85D26', green:'#2E9E55', border:'#ede8e2' }
const palette = [
  {bg:'#FEF0EA',color:'#E85D26'},{bg:'#EAF8EE',color:'#2E9E55'},
  {bg:'#F3EFFE',color:'#7F77DD'},{bg:'#FEF5EA',color:'#D4860A'},
  {bg:'#EAF4FE',color:'#2E7BD4'},{bg:'#FEEBF0',color:'#D4204D'},
]

export default function InfluencerDirectoryPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    getInfluencers({ limit: PAGE_SIZE * 2, offset: 0 }).then(({ data, count }) => { setInfluencers(data); setTotal(count); setLoading(false) })
  }, [])

  const allFiltered = influencers.filter(i => {
    const matchSearch = !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.handle.toLowerCase().includes(search.toLowerCase()) ||
      (i.cuisine_tags ?? []).some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchPlatform = platform === 'all' || i.platform === platform
    return matchSearch && matchPlatform
  })
  const filtered = allFiltered.slice(0, page * PAGE_SIZE)

  return (
    <div style={{ fontFamily:"-apple-system,sans-serif", background:'#fafafa', minHeight:'100vh', color:'#1a1a1a' }}>
      <Nav />

      {/* HEADER */}
      <div style={{ background:'linear-gradient(135deg,#fff9f6,#fff)', padding:'32px 24px 24px', borderBottom:`1px solid ${C.border}` }}>
        <h1 style={{ fontSize:26, fontWeight:700, marginBottom:6 }}>✨ Food Influencers · Bengaluru</h1>
        <p style={{ fontSize:14, color:'#888', marginBottom:20 }}>
          {influencers.length} creators tracked · ranked by real visit impact, not follower count
        </p>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', background:'#fff', border:`2px solid ${C.coral}`, borderRadius:40, padding:'7px 7px 7px 16px', gap:8, flex:'1', maxWidth:400 }}>
            <span>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, handle, or cuisine..."
              style={{ background:'none', border:'none', outline:'none', fontSize:13, flex:1 }} />
            {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#aaa' }}>✕</button>}
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {[['all','All'],['instagram','Instagram'],['youtube','YouTube'],['both','Both']].map(([v,l]) => (
              <button key={v} onClick={() => setPlatform(v)}
                style={{ background: platform===v ? C.coral : '#fff', color: platform===v ? '#fff' : '#666', border:`1px solid ${platform===v ? C.coral : C.border}`, borderRadius:20, padding:'7px 16px', fontSize:12, fontWeight:500, cursor:'pointer' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px' }}>
        {loading ? <GridSkeleton count={6} cols={3} /> : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>No influencers match your search.</div>
        ) : (
          <>
            <div style={{ fontSize:13, color:'#888', marginBottom:16 }}>
              Showing {filtered.length} influencer{filtered.length !== 1 ? 's' : ''}
            </div>

            {/* Featured top 3 */}
            {!search && platform === 'all' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
                {filtered.slice(0,3).map((inf, i) => {
                  const p = palette[i]
                  const medals = ['🥇','🥈','🥉']
                  return (
                    <InfluencerCard key={inf.id} influencer={inf} index={i} rank={i+1} />
                  )
                })}
              </div>
            )}

            {/* Rest as list */}
            <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden' }}>
              {(search || platform !== 'all' ? filtered : filtered.slice(3)).map((inf, i) => {
                const p = palette[i % palette.length]
                return (
                  <InfluencerCard key={inf.id} influencer={inf} index={i % palette.length} compact />
                )
              })}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
