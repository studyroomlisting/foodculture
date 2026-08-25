'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { GridSkeleton } from '@/components/Skeleton'
import type { Restaurant, Zone } from '@/types/database'
import { getTrendingZones } from '@/lib/queries'

const C = { coral: '#E85D26', green: '#2E9E55', amber: '#D4860A', purple: '#7F77DD', border: '#ede8e2' }
const PAGE_SIZE = 12

const STATUSES = [
  { val:'all',    label:'All' },
  { val:'viral',  label:'🔥 Viral' },
  { val:'rising', label:'📈 Rising' },
  { val:'new',    label:'✨ New' },
]
const SORTS = [
  { val:'score',  label:'AI Score' },
  { val:'rating', label:'Rating' },
  { val:'name',   label:'Name A–Z' },
  { val:'newest', label:'Newest' },
]
const RATINGS = [
  { val:'',    label:'Any rating' },
  { val:'4.5', label:'★ 4.5+' },
  { val:'4.0', label:'★ 4.0+' },
  { val:'3.5', label:'★ 3.5+' },
]
const TIERS = ['₹','₹₹','₹₹₹','₹₹₹₹']
const CUISINES = ['Biryani','South Indian','North Indian','Seafood','Cafes','Fine Dining','Street Food','Desserts','Burgers','Pizza']

const STATUS_STYLE: Record<string,{ bg:string; color:string }> = {
  viral:  { bg:'#FEF0EA', color:C.coral  },
  rising: { bg:'#EAF8EE', color:C.green  },
  new:    { bg:'#FEF9EA', color:C.amber  },
  active: { bg:'#f0f0f0', color:'#888'   },
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      style={{ background: active ? C.coral : '#fff', color: active ? '#fff' : '#666', border: `1px solid ${active ? C.coral : C.border}`, borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all .15s' }}>
      {children}
    </button>
  )
}

export default function RestaurantDirectoryLive() {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()

  // State initialised from URL params
  const [search,     setSearch]     = useState(params.get('q')        ?? '')
  const [status,     setStatus]     = useState(params.get('status')   ?? 'all')
  const [sort,       setSort]       = useState(params.get('sort')      ?? 'score')
  const [zoneId,     setZoneId]     = useState(params.get('zone')     ?? '')
  const [minRating,  setMinRating]  = useState(params.get('rating')   ?? '')
  const [priceTiers, setPriceTiers] = useState<string[]>(params.get('price') ? params.get('price')!.split(',') : [])
  const [cuisines,   setCuisines]   = useState<string[]>(params.get('cuisine') ? params.get('cuisine')!.split(',') : [])
  const [showFilters,setShowFilters]= useState(false)

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [zones,       setZones]       = useState<Zone[]>([])
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total,       setTotal]       = useState(0)
  const [elapsed,     setElapsed]     = useState<number|null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Sync filters → URL
  function syncUrl(overrides: Record<string,string>) {
    const p = new URLSearchParams()
    const vals: Record<string,string> = {
      q: search, status, sort, zone: zoneId,
      rating: minRating, price: priceTiers.join(','),
      cuisine: cuisines.join(','), ...overrides,
    }
    Object.entries(vals).forEach(([k,v]) => { if (v && v !== 'all') p.set(k, v) })
    router.replace(`${pathname}?${p.toString()}`, { scroll: false })
  }

  // Server-side search
  const doSearch = useCallback(async (offset = 0, append = false) => {
    if (offset === 0 && !append) setLoading(true)
    else setLoadingMore(true)

    try {
      const res = await fetch('/api/search/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: search.trim() || undefined,
          zone_id: zoneId || undefined,
          status: status !== 'all' ? status : undefined,
          sort, limit: PAGE_SIZE, offset,
          min_rating: minRating ? parseFloat(minRating) : undefined,
          price_tiers: priceTiers.length > 0 ? priceTiers : undefined,
          cuisines: cuisines.length > 0 ? cuisines : undefined,
        }),
      })
      const json = await res.json()
      if (append) setRestaurants(prev => [...prev, ...(json.data ?? [])])
      else        setRestaurants(json.data ?? [])
      setTotal(json.count ?? 0)
      setElapsed(json.elapsed_ms ?? null)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [search, zoneId, status, sort, minRating, priceTiers, cuisines])

  // Debounced search trigger
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(0), search ? 350 : 0)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [doSearch])

  // Load zones once
  useEffect(() => { getTrendingZones().then(setZones).catch(() => {}) }, [])

  function setFilter<T>(setter: (v: T) => void, key: string, val: T, strVal: string) {
    setter(val)
    syncUrl({ [key]: strVal })
  }

  function togglePriceTier(tier: string) {
    const next = priceTiers.includes(tier) ? priceTiers.filter(t => t !== tier) : [...priceTiers, tier]
    setPriceTiers(next)
    syncUrl({ price: next.join(',') })
  }

  function toggleCuisine(c: string) {
    const next = cuisines.includes(c) ? cuisines.filter(x => x !== c) : [...cuisines, c]
    setCuisines(next)
    syncUrl({ cuisine: next.join(',') })
  }

  function clearAll() {
    setSearch(''); setStatus('all'); setSort('score'); setZoneId('')
    setMinRating(''); setPriceTiers([]); setCuisines([])
    router.replace(pathname, { scroll: false })
  }

  const hasFilters = search || status !== 'all' || zoneId || minRating || priceTiers.length || cuisines.length
  const activeFilterCount = [status !== 'all', !!zoneId, !!minRating, priceTiers.length > 0, cuisines.length > 0].filter(Boolean).length

  return (
    <div style={{ fontFamily:'-apple-system,sans-serif', background:'#fafafa', minHeight:'100vh', color:'#1a1a1a' }}>
      <Nav />

      {/* ── SEARCH HEADER ── */}
      <div style={{ background:'linear-gradient(135deg,#fff9f6,#fff)', padding:'28px 24px 20px', borderBottom:`1px solid ${C.border}` }}>
        <h1 style={{ fontSize:24, fontWeight:700, marginBottom:4 }}>Bengaluru Restaurants</h1>
        <p style={{ fontSize:13, color:'#888', marginBottom:18 }}>
          {total > 0 ? `${total.toLocaleString('en-IN')} restaurant${total !== 1 ? 's' : ''}` : 'Restaurants tracked'} across {zones.length} zones
          {elapsed !== null && <span style={{ color: elapsed < 500 ? C.green : C.amber }}> · {elapsed}ms</span>}
        </p>

        <div style={{ display:'flex', gap:10, maxWidth:640 }}>
          {/* Search input */}
          <div style={{ flex:1, display:'flex', alignItems:'center', background:'#fff', border:`2px solid ${C.coral}`, borderRadius:40, padding:'8px 8px 8px 16px', gap:8 }}>
            <span aria-hidden="true" style={{ fontSize:16 }}>🔍</span>
            <label htmlFor="dir-search" style={{ display:'none' }}>Search restaurants</label>
            <input id="dir-search" type="search" value={search}
              onChange={e => { setSearch(e.target.value); syncUrl({ q: e.target.value }) }}
              placeholder="Name, area, cuisine…"
              style={{ background:'none', border:'none', outline:'none', fontSize:14, flex:1, fontFamily:'inherit' }} />
            {search && (
              <button onClick={() => { setSearch(''); syncUrl({ q:'' }) }} aria-label="Clear search"
                style={{ background:'none', border:'none', cursor:'pointer', color:'#aaa', fontSize:16, padding:'0 4px' }}>✕</button>
            )}
          </div>

          {/* Filter toggle */}
          <button onClick={() => setShowFilters(v => !v)}
            style={{ background: showFilters ? '#1a1a1a' : '#fff', color: showFilters ? '#fff' : '#555', border:`1px solid ${showFilters ? '#1a1a1a' : C.border}`, borderRadius:24, padding:'0 18px', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', fontFamily:'inherit' }}>
            ⚙️ Filters {activeFilterCount > 0 && <span style={{ background:C.coral, color:'#fff', borderRadius:'50%', width:18, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700 }}>{activeFilterCount}</span>}
          </button>

          {/* Sort */}
          <select value={sort} onChange={e => { setSort(e.target.value); syncUrl({ sort: e.target.value }) }}
            aria-label="Sort by"
            style={{ border:`1px solid ${C.border}`, borderRadius:24, padding:'0 16px', fontSize:13, background:'#fff', cursor:'pointer', fontFamily:'inherit', outline:'none' }}>
            {SORTS.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── FILTER PANEL ── */}
      {showFilters && (
        <div style={{ background:'#fff', borderBottom:`1px solid ${C.border}`, padding:'16px 24px' }}>
          {/* Status */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>Trending status</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {STATUSES.map(s => (
                <FilterBtn key={s.val} active={status===s.val} onClick={() => { setStatus(s.val); syncUrl({ status:s.val }) }}>{s.label}</FilterBtn>
              ))}
            </div>
          </div>

          {/* Zones */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>Zone</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <FilterBtn active={!zoneId} onClick={() => { setZoneId(''); syncUrl({ zone:'' }) }}>All zones</FilterBtn>
              {zones.map(z => (
                <FilterBtn key={z.id} active={zoneId===z.id} onClick={() => { setZoneId(z.id); syncUrl({ zone:z.id }) }}>{z.name}</FilterBtn>
              ))}
            </div>
          </div>

          {/* Cuisine */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>Cuisine</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {CUISINES.map(c => (
                <FilterBtn key={c} active={cuisines.includes(c)} onClick={() => toggleCuisine(c)}>{c}</FilterBtn>
              ))}
            </div>
          </div>

          {/* Rating + Price row */}
          <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>Min rating</div>
              <div style={{ display:'flex', gap:6 }}>
                {RATINGS.map(r => (
                  <FilterBtn key={r.val} active={minRating===r.val} onClick={() => { setMinRating(r.val); syncUrl({ rating:r.val }) }}>{r.label}</FilterBtn>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>Budget</div>
              <div style={{ display:'flex', gap:6 }}>
                {TIERS.map(t => (
                  <FilterBtn key={t} active={priceTiers.includes(t)} onClick={() => togglePriceTier(t)}>{t}</FilterBtn>
                ))}
              </div>
            </div>
          </div>

          {hasFilters && (
            <button onClick={clearAll}
              style={{ marginTop:14, background:'none', border:`1px solid #fecaca`, borderRadius:20, padding:'6px 16px', fontSize:12, color:'#dc2626', cursor:'pointer', fontFamily:'inherit' }}>
              ✕ Clear all filters
            </button>
          )}
        </div>
      )}

      {/* ── QUICK STATUS CHIPS (always visible) ── */}
      <div style={{ background:'#fff', padding:'10px 24px', borderBottom:`1px solid ${C.border}`, display:'flex', gap:6, overflowX:'auto' }}>
        {STATUSES.map(s => (
          <FilterBtn key={s.val} active={status===s.val} onClick={() => { setStatus(s.val); syncUrl({ status:s.val }) }}>{s.label}</FilterBtn>
        ))}
      </div>

      {/* ── RESULTS ── */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'20px 24px' }}>
        {loading ? (
          <GridSkeleton count={PAGE_SIZE} cols={3} />
        ) : restaurants.length === 0 ? (
          <div role="status" style={{ textAlign:'center', padding:60 }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🍽️</div>
            <h2 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>No restaurants found</h2>
            <p style={{ fontSize:14, color:'#888', marginBottom:20 }}>
              {search ? `No results for "${search}"` : 'No restaurants match these filters.'}
            </p>
            <button onClick={clearAll}
              style={{ background:C.coral, color:'#fff', border:'none', borderRadius:24, padding:'10px 24px', fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize:13, color:'#888', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>
                {restaurants.length} of {total.toLocaleString('en-IN')} restaurant{total !== 1 ? 's' : ''}
                {hasFilters && ' (filtered)'}
              </span>
              {elapsed !== null && (
                <span style={{ fontSize:12, color: elapsed < 500 ? C.green : C.amber }}>
                  ⚡ {elapsed}ms
                </span>
              )}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
              {restaurants.map(r => {
                const ss = STATUS_STYLE[r.status] ?? STATUS_STYLE.active
                const primary = (r as any).listing_images?.find((i: any) => i.is_primary) ?? (r as any).listing_images?.[0]
                return (
                  <Link key={r.id} href={`/restaurants/${r.slug}`} style={{ textDecoration:'none', color:'inherit' }}>
                    <article style={{ background:'#fff', borderRadius:16, border:`1px solid ${C.border}`, overflow:'hidden', cursor:'pointer', transition:'transform .15s, box-shadow .15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 8px 24px rgba(0,0,0,.08)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.boxShadow='' }}>
                      {/* Image */}
                      <div style={{ height:140, background: primary ? `url(${primary.url}) center/cover` : '#FEF0EA', display:'flex', alignItems:'center', justifyContent:'center', fontSize:52, position:'relative' }}>
                        {!primary && r.emoji}
                        {r.status && r.status !== 'active' && (
                          <span style={{ position:'absolute', top:10, left:10, background:ss.bg, color:ss.color, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
                            {ss.color === C.coral ? '🔥' : ss.color === C.green ? '📈' : '✨'} {r.status.charAt(0).toUpperCase()+r.status.slice(1)}
                          </span>
                        )}
                      </div>
                      {/* Info */}
                      <div style={{ padding:'14px 16px' }}>
                        <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{r.name}</div>
                        <div style={{ fontSize:12, color:'#888', marginBottom:8, display:'flex', alignItems:'center', gap:4 }}>
                          <span>📍</span>{r.area_label} · {r.price_tier ?? '₹₹'}
                        </div>
                        {r.cuisine_tags?.slice(0,3).map((tag: string) => (
                          <span key={tag} style={{ fontSize:10, background:'#f5f0ea', color:'#666', padding:'2px 8px', borderRadius:10, marginRight:4 }}>{tag}</span>
                        ))}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10 }}>
                          <span style={{ fontSize:13, fontWeight:600 }}>⭐ {r.rating ?? '—'} <span style={{ fontWeight:400, color:'#aaa', fontSize:11 }}>({r.total_reviews ?? 0})</span></span>
                          <span style={{ fontSize:11, fontWeight:700, color:C.coral, background:'#FEF0EA', padding:'3px 8px', borderRadius:8 }}>AI {r.intelligence_score ?? '—'}</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                )
              })}
            </div>

            {/* Infinite scroll / Load more */}
            {restaurants.length < total && (
              <div style={{ textAlign:'center', marginTop:28 }}>
                <button onClick={() => doSearch(restaurants.length, true)} disabled={loadingMore}
                  style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:24, padding:'12px 32px', fontSize:14, color:'#666', cursor:'pointer', opacity:loadingMore?0.7:1, fontFamily:'inherit' }}>
                  {loadingMore ? 'Loading…' : `Load ${Math.min(12, total - restaurants.length)} more`}
                </button>
                <span style={{ display:'block', marginTop:10, fontSize:12, color:'#aaa', textAlign:'center' }}>
                  Showing {restaurants.length} of {total} restaurants
                </span>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
