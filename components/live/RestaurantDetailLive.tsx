'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { PageLoader } from '@/components/Skeleton'
import { Breadcrumbs, localBusinessSchema } from '@/lib/seo'
import { getRestaurantBySlug, getReviews, getDealsForRestaurant, getPostsForRestaurant } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import type { Restaurant, Review, Deal, InfluencerRestaurantPost } from '@/types/database'

const C = { coral:'#E85D26', gold:'#F5A623', green:'#2E9E55', border:'#ede8e2' }

export default function RestaurantDetailLive({ slug }: { slug: string }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [reviews, setReviews]       = useState<Review[]>([])
  const [deals, setDeals]           = useState<Deal[]>([])
  const [posts, setPosts]           = useState<InfluencerRestaurantPost[]>([])
  const [activeTab, setActiveTab]   = useState<'overview'|'reviews'|'deals'|'influencers'>('overview')
  const [loading, setLoading]       = useState(true)
  const [isSaved, setIsSaved]       = useState(false)
  const [images, setImages]           = useState<any[]>([])
  const [userId, setUserId]         = useState<string|null>(null)
  // enquiry form
  const [enquiry, setEnquiry]       = useState({ name:'', email:'', phone:'', message:'' })
  const [enquirySent, setEnquirySent] = useState(false)
  // review form
  const [reviewForm, setReviewForm] = useState({ rating:5, body:'' })
  const [reviewSent, setReviewSent]     = useState(false)
  const [reviewError, setReviewError]     = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [enquirySending, setEnquirySending] = useState(false)
  const [enquiryError, setEnquiryError] = useState('')
  const [editingReview, setEditingReview] = useState<string|null>(null)
  const [editBody, setEditBody]         = useState('')
  const [editRating, setEditRating]     = useState(5)
  const [avgRating, setAvgRating]       = useState<number|null>(null)
  const [userReviewId, setUserReviewId] = useState<string|null>(null)
  const [userProfileName, setUserProfileName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data: p } = await (supabase as any).from('profiles').select('full_name').eq('id', user.id).single()
      if (p?.full_name) setUserProfileName(p.full_name)
    })
    getRestaurantBySlug(slug).then(r => {
      if (!r) { setLoading(false); return }
      setRestaurant(r)
      Promise.all([
        getReviews(r.id, 10),
        getDealsForRestaurant(r.id),
        getPostsForRestaurant(r.id, 5),
        (supabase as any).from('listing_images').select('url,alt_text,is_primary,sort_order').eq('restaurant_id', r.id).order('sort_order'),
      ]).then(([rv, dl, ps, imgs]) => {
        setReviews(rv); setDeals(dl); setPosts(ps)
        if (rv.length > 0) setAvgRating(Math.round((rv.reduce((s,r)=>s+r.rating,0)/rv.length)*10)/10)
        setImages((imgs as any).data ?? [])
        setLoading(false)
      })
    })
  }, [slug])

  useEffect(() => {
    if (!restaurant || !userId) return
    (supabase as any).from('saved_listings').select('id').eq('user_id', userId).eq('restaurant_id', restaurant.id).single()
      .then(({ data }) => setIsSaved(!!data))
  }, [restaurant, userId])

  async function toggleSave() {
    if (!userId) { window.location.href = `/auth/signin?next=/restaurants/${slug}`; return }
    if (isSaved) {
      await (supabase as any).from('saved_listings').delete().eq('user_id', userId).eq('restaurant_id', restaurant!.id)
      setIsSaved(false)
    } else {
      await (supabase as any).from('saved_listings').insert([{ user_id: userId, restaurant_id: restaurant!.id }])
      setIsSaved(true)
    }
  }

  async function submitEnquiry(e: React.FormEvent) {
    e.preventDefault()
    setEnquiryError('')
    if (enquiry.message.trim().length < 10) { setEnquiryError('Message must be at least 10 characters.'); return }
    setEnquirySending(true)
    const res = await fetch('/api/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_id: restaurant!.id,
        sender_name:   enquiry.name.trim(),
        sender_email:  enquiry.email.trim(),
        sender_phone:  enquiry.phone.trim() || undefined,
        message:       enquiry.message.trim(),
      }),
    })
    setEnquirySending(false)
    if (res.ok) { setEnquirySent(true) }
    else { const j = await res.json(); setEnquiryError(j.error || 'Failed to send enquiry. Please try again.') }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    setReviewError('')
    if (!userId) { window.location.href = `/auth/signin?next=/restaurants/${slug}`; return }
    if (!reviewForm.rating) { setReviewError('Please select a star rating.'); return }
    if ((reviewForm.body ?? '').trim().length < 20) { setReviewError('Review must be at least 20 characters.'); return }

    setSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_id: restaurant!.id, rating: reviewForm.rating, body: reviewForm.body }),
      })
      const json = await res.json()
      if (!res.ok) { setReviewError(json.error || 'Failed to submit review.'); return }
      const newReview: Review = {
        id: json.review?.id || Date.now().toString(),
        restaurant_id: restaurant!.id,
        reviewer_name: json.review?.reviewer_name || 'You',
        rating: reviewForm.rating,
        body: reviewForm.body,
        created_at: new Date().toISOString(),
        verified_visit: false,
      }
      setReviews(prev => [newReview, ...prev])
      setReviewForm({ rating: 5, body: '' })
      setReviewSent(true)
    } catch {
      setReviewError('Something went wrong. Please try again.')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <><Nav /><PageLoader /></>
  if (!restaurant) return <><Nav /><div style={{ textAlign:'center', padding:80, color:'#aaa' }}>Restaurant not found.</div><Footer /></>

  const tabs = [
    { key:'overview'    as const, label:'📊 Overview' },
    { key:'reviews'     as const, label:`⭐ Reviews (${reviews.length})` },
    { key:'deals'       as const, label:`🎟 Deals (${deals.length})` },
    { key:'influencers' as const, label:`✨ Influencers (${posts.length})` },
  ]

  const dealColors: Record<string,{bg:string;color:string}> = {
    orange:{bg:'#FEF0EA',color:C.coral}, green:{bg:'#EAF8EE',color:C.green}, purple:{bg:'#F3EFFE',color:'#7F77DD'}
  }

  const schema = localBusinessSchema({ name:restaurant.name, area_label:restaurant.area_label, slug:restaurant.slug, rating:restaurant.rating, total_reviews:restaurant.total_reviews, cuisine_tags:restaurant.cuisine_tags, open_until:restaurant.open_until, price_tier:restaurant.price_tier })

  return (
    <div style={{ fontFamily:"-apple-system,sans-serif", background:'#fafafa', minHeight:'100vh', color:'#1a1a1a' }}>
      {/* JSON-LD structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <Nav />

      <div style={{ background:'#fff', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'0 24px' }}>
          <Breadcrumbs crumbs={[{ label:'Home', href:'/' }, { label:'Restaurants', href:'/restaurants' }, { label: restaurant.name }]} />

          <div style={{ display:'flex', gap:20, alignItems:'flex-start', padding:'16px 0 0' }}>
            <div style={{ width:80, height:80, borderRadius:16, overflow:'hidden', flexShrink:0, background:'#FEF0EA', position:'relative' }} aria-hidden="true">
              {images[0]?.url ? (
                <img src={images[0].url} alt={restaurant.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              ) : (
                <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>{restaurant.emoji}</div>
              )}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                <h1 style={{ fontSize:24, fontWeight:700, margin:0 }}>{restaurant.name}</h1>
                <span style={{ background:'#FEF0EA', color:C.coral, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:10, textTransform:'capitalize' }}>{restaurant.status}</span>
              </div>
              <div style={{ fontSize:13, color:'#888', marginBottom:10 }}>
                📍 {restaurant.area_label} · {restaurant.price_tier} · avg ₹{restaurant.avg_spend} · Open till {restaurant.open_until}
              </div>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 }}>
                {restaurant.cuisine_tags.map(t => (
                  <span key={t} style={{ fontSize:11, background:'#f5f0eb', color:'#666', padding:'3px 10px', borderRadius:8 }}>{t}</span>
                ))}
              </div>
              <div style={{ display:'flex', gap:14, alignItems:'center', flexWrap:'wrap' }}>
                <span style={{ fontWeight:700, fontSize:15 }}>⭐ {restaurant.rating}</span>
                <span style={{ fontSize:13, color:'#888' }}>{restaurant.total_reviews} reviews</span>
                <span style={{ fontSize:13, color:'#888' }}>Peak: {restaurant.peak_hours}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
              <button onClick={toggleSave} aria-label={isSaved ? 'Remove from saved' : 'Save this restaurant'}
                style={{ background: isSaved ? '#FEF0EA' : '#fff', border:`1px solid ${isSaved ? C.coral : C.border}`, borderRadius:20, padding:'8px 16px', fontSize:13, color: isSaved ? C.coral : '#666', cursor:'pointer', fontWeight: isSaved ? 600 : 400 }}>
                {isSaved ? '❤️ Saved' : '🤍 Save'}
              </button>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((restaurant.name || '') + ' ' + (restaurant.area_label || '') + ' Bengaluru')}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display:'block', textAlign:'center', background:'#fff', border:`1px solid ${C.border}`, borderRadius:20, padding:'8px 16px', fontSize:13, color:'#555', textDecoration:'none' }}>
                📍 Directions
              </a>
              <button onClick={async () => {
                const url = window.location.href
                if (navigator.share) {
                  await navigator.share({ title: restaurant.name || 'Restaurant', url }).catch(() => {})
                } else {
                  navigator.clipboard.writeText(url).catch(() => {})
                }
              }} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:20, padding:'8px 16px', fontSize:13, color:'#555', cursor:'pointer' }}>
                🔗 Share
              </button>
              <div style={{ textAlign:'center', background:'#FEF9F6', border:`1px solid #f5d5c0`, borderRadius:14, padding:'12px 16px' }}>
                <div style={{ fontSize:32, fontWeight:700, color:C.coral, lineHeight:1 }}>{restaurant.intelligence_score}</div>
                <div style={{ fontSize:10, color:'#aaa', marginTop:4 }}>AI Score</div>
                <div style={{ fontSize:11, color:C.green, marginTop:2, fontWeight:600 }}>+{restaurant.intelligence_score_trend} this week</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', borderTop:`1px solid ${C.border}`, marginTop:16 }} role="tablist">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                role="tab" aria-selected={activeTab === t.key} aria-controls={`panel-${t.key}`}
                style={{ background:'none', border:'none', borderBottom: activeTab===t.key ? `2px solid ${C.coral}` : '2px solid transparent', padding:'12px 20px', fontSize:13, fontWeight: activeTab===t.key ? 600 : 400, color: activeTab===t.key ? C.coral : '#666', cursor:'pointer', marginBottom:-1 }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:24 }}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div id="panel-overview" role="tabpanel" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={{ gridColumn:'1/-1', background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:20 }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.coral, marginBottom:10 }}>✦ AI Intelligence Brief</div>
              <p style={{ fontSize:14, color:'#444', lineHeight:1.7, margin:0 }}>{restaurant.ai_brief}</p>
            </div>
            {[
              { label:'Total Reviews', value:restaurant.total_reviews.toLocaleString() },
              { label:'Avg Spend',     value:`₹${restaurant.avg_spend}` },
              { label:'Peak Hours',    value:restaurant.peak_hours ?? '—' },
              { label:'Open Until',    value:restaurant.open_until ?? '—' },
            ].map(s => (
              <div key={s.label} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:20, textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:700 }}>{s.value}</div>
                <div style={{ fontSize:12, color:'#aaa', marginTop:4 }}>{s.label}</div>
              </div>
            ))}

            {/* ENQUIRY FORM */}
            <div style={{ gridColumn:'1/-1', background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>📬 Send an enquiry</div>
              {enquirySent ? (
                <div style={{ background:'#EAF8EE', border:'1px solid #b8e8c8', borderRadius:10, padding:'14px 18px', fontSize:14, color:C.green }}>
                  ✓ Enquiry sent! The restaurant will get back to you within 24 hours.
                </div>
              ) : (
                <form onSubmit={submitEnquiry} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  {[
                    { key:'name', label:'Your name', ph:'Priya Sharma', col:1 },
                    { key:'email', label:'Email', ph:'you@example.com', col:1 },
                    { key:'phone', label:'Phone (optional)', ph:'+91 98765 43210', col:1 },
                  ].map(f => (
                    <div key={f.key}>
                      <label htmlFor={`enquiry-${f.key}`} style={{ fontSize:12, fontWeight:500, color:'#555', display:'block', marginBottom:5 }}>{f.label}</label>
                      <input id={`enquiry-${f.key}`} type={f.key==='email'?'email':'text'} required={f.key!=='phone'} placeholder={f.ph}
                        value={(enquiry as any)[f.key]} onChange={e => setEnquiry(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ width:'100%', boxSizing:'border-box', border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', fontSize:13, outline:'none' }} />
                    </div>
                  ))}
                  <div style={{ gridColumn:'1/-1' }}>
                    <label htmlFor="enquiry-message" style={{ fontSize:12, fontWeight:500, color:'#555', display:'block', marginBottom:5 }}>Message *</label>
                    <textarea id="enquiry-message" required rows={3} placeholder="e.g. I'd like to book a table for 6 on Saturday evening..."
                      value={enquiry.message} onChange={e => setEnquiry(p => ({ ...p, message: e.target.value }))}
                      style={{ width:'100%', boxSizing:'border-box', border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', fontSize:13, outline:'none', resize:'vertical' }} />
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <button type="submit" style={{ background:C.coral, color:'#fff', border:'none', borderRadius:10, padding:'11px 24px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                      Send enquiry
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* IMAGE GALLERY */}
            {images.length > 0 && (
              <div style={{ gridColumn:'1/-1', display:'flex', gap:10, overflowX:'auto', paddingBottom:4 }}>
                {images.map((img: any, idx: number) => (
                  <div key={idx} style={{ flexShrink:0, width:180, height:120, borderRadius:10, overflow:'hidden', border:`1px solid ${C.border}`, background:'#FEF0EA' }}>
                    <img src={img.url} alt={img.alt_text ?? restaurant.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  </div>
                ))}
              </div>
            )}

            {/* CLAIM LISTING */}
            {!((restaurant as any).owner_id) && (
              <div style={{ gridColumn:'1/-1', background:'#f9f9f9', border:`1px dashed ${C.border}`, borderRadius:14, padding:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>Is this your restaurant?</div>
                  <div style={{ fontSize:12, color:'#888' }}>Claim this listing to manage it, respond to reviews, and connect with influencers.</div>
                </div>
                <Link href={`/restaurants/${slug}/claim`} style={{ background:'#1a1a1a', color:'#fff', borderRadius:20, padding:'8px 18px', fontSize:12, fontWeight:600, textDecoration:'none', flexShrink:0, marginLeft:16 }}>
                  Claim listing →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* REVIEWS */}
        {activeTab === 'reviews' && (
          <div id="panel-reviews" role="tabpanel">
            {/* Submit review */}
            <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:20, marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Write a review</div>
              {reviewSent ? (
                <div style={{ background:'#EAF8EE', border:'1px solid #b8e8c8', borderRadius:10, padding:'12px 16px', fontSize:14, color:C.green }}>✓ Review submitted! Thank you.</div>
              ) : (
                <form onSubmit={submitReview} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {reviewError && (
                    <div role="alert" style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#dc2626' }}>{reviewError}</div>
                  )}
                  <div>
                    <div style={{ fontSize:12, fontWeight:500, color:'#555', marginBottom:8 }}>Rating</div>
                    <div style={{ display:'flex', gap:6 }}>
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => setReviewForm(p => ({ ...p, rating: n }))}
                          aria-label={`${n} star${n>1?'s':''}`}
                          style={{ fontSize:24, background:'none', border:'none', cursor:'pointer', color: n <= reviewForm.rating ? C.gold : '#ddd', padding:'0 2px' }}>
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="review-body" style={{ fontSize:12, fontWeight:500, color:'#555', display:'block', marginBottom:6 }}>Your review</label>
                    <textarea id="review-body" required rows={3} placeholder="Share your experience..."
                      value={reviewForm.body} onChange={e => setReviewForm(p => ({ ...p, body: e.target.value }))}
                      style={{ width:'100%', boxSizing:'border-box', border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', fontSize:13, outline:'none', resize:'vertical' }} />
                  </div>
                  <button type="submit" disabled={!reviewForm.body || submittingReview}
                    style={{ background:C.coral, color:'#fff', border:'none', borderRadius:10, padding:'10px 22px', fontSize:13, fontWeight:600, cursor: submittingReview ? 'default' : 'pointer', alignSelf:'flex-start', opacity: (!reviewForm.body || submittingReview) ? 0.5 : 1 }}>
                    {submittingReview ? 'Submitting…' : 'Submit review'}
                  </button>
                </form>
              )}
            </div>

            {/* Review list */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {reviews.length === 0
                ? <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>No reviews yet. Be the first!</div>
                : reviews.map(r => (
                  <div key={r.id} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:18 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:'50%', background:'#FEF0EA', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:C.coral, fontSize:13 }} aria-hidden="true">
                          {r.reviewer_name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600 }}>{r.reviewer_name}</div>
                          <div style={{ fontSize:11, color:'#aaa' }}>
                            {new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                            {r.verified_visit && <span style={{ color:C.green, marginLeft:8 }}>✓ Verified</span>}
                          </div>
                        </div>
                      </div>
                      <div aria-label={`Rated ${r.rating} out of 5 stars`}>
                        {Array.from({length:5}).map((_,i)=><span key={i} aria-hidden="true" style={{ color:i<r.rating?C.gold:'#ddd', fontSize:14 }}>★</span>)}
                      </div>
                    </div>
                    <p style={{ fontSize:14, color:'#444', lineHeight:1.6, margin:0 }}>{r.body}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* DEALS */}
        {activeTab === 'deals' && (
          <div id="panel-deals" role="tabpanel" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
            {deals.length === 0
              ? <div style={{ gridColumn:'1/-1', textAlign:'center', padding:40, color:'#aaa' }}>No active deals right now.</div>
              : deals.map(d => {
                const dc = dealColors[d.color_theme] ?? dealColors.orange
                return (
                  <div key={d.id} style={{ background:dc.bg, border:`1px solid ${dc.color}30`, borderRadius:14, padding:18 }}>
                    <div style={{ fontSize:22, marginBottom:8 }} aria-hidden="true">🎟</div>
                    <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>{d.title}</div>
                    <p style={{ fontSize:13, color:'#555', marginBottom:10, lineHeight:1.5 }}>{d.description}</p>
                    <div style={{ fontWeight:700, color:dc.color, fontSize:13, marginBottom:8 }}>{d.savings_label}</div>
                    <code style={{ display:'block', background:'#fff', borderRadius:8, padding:'6px 12px', fontSize:13, fontWeight:700, color:dc.color, letterSpacing:1.5 }}>{d.code}</code>
                    {d.expires_at && <div style={{ fontSize:11, color:'#888', marginTop:8 }}>Expires: {new Date(d.expires_at).toLocaleDateString('en-IN')}</div>}
                  </div>
                )
              })}
          </div>
        )}

        {/* INFLUENCERS */}
        {activeTab === 'influencers' && (
          <div id="panel-influencers" role="tabpanel" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {posts.length === 0
              ? <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>No influencer coverage yet.</div>
              : posts.map(p => {
                const inf = (p as any).influencer
                return (
                  <div key={p.id} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:18, display:'flex', gap:14 }}>
                    <div style={{ width:44, height:44, borderRadius:'50%', background:'#FEF0EA', color:C.coral, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15, flexShrink:0 }} aria-hidden="true">
                      {inf?.avatar_initials ?? '?'}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                        <span style={{ fontSize:14, fontWeight:600 }}>{inf?.name}</span>
                        <span style={{ fontSize:11, color:'#888' }}>{inf?.handle}</span>
                        <span style={{ fontSize:11, background:'#FEF0EA', color:C.coral, padding:'2px 8px', borderRadius:8, fontWeight:600 }}>{inf?.impact_score}% impact</span>
                      </div>
                      <p style={{ fontSize:13, color:'#555', marginBottom:10, lineHeight:1.5 }}>{p.caption}</p>
                      <div style={{ display:'flex', gap:16, fontSize:12, color:'#888', flexWrap:'wrap' }}>
                        <span>👁 {p.views.toLocaleString()}</span>
                        <span>❤️ {p.likes.toLocaleString()}</span>
                        <span>💬 {p.comments.toLocaleString()}</span>
                        <span style={{ color:C.green, fontWeight:600 }}>🚶 {p.visits_driven} visits</span>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
      {/* Similar restaurants */}
      {restaurant && restaurant.cuisine_tags && restaurant.cuisine_tags.length > 0 && (
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 24px 40px' }}>
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>🍽️ Similar restaurants</h2>
          <SimilarRestaurants cuisines={restaurant.cuisine_tags} zoneId={restaurant.zone_id} excludeId={restaurant.id} />
        </div>
      )}
      <Footer />
    </div>
  )
}

function SimilarRestaurants({ cuisines, zoneId, excludeId }: { cuisines: string[]; zoneId?: string; excludeId: string }) {
  const [similar, setSimilar] = useState<any[]>([])
  const C2 = { coral: '#E85D26', border: '#ede8e2' }
  useEffect(() => {
    fetch('/api/search/restaurants', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuisines: cuisines.slice(0, 2), zone_id: zoneId, limit: 4, offset: 0, sort: 'score' }),
    }).then(r => r.json()).then(j => {
      setSimilar((j.data ?? []).filter((r: any) => r.id !== excludeId).slice(0, 3))
    }).catch(() => {})
  }, [excludeId])
  if (similar.length === 0) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
      {similar.map(r => (
        <a key={r.id} href={`/restaurants/${r.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: '#fff', border: `1px solid ${C2.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ height: 80, background: '#FEF0EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>{r.emoji || '🍽️'}</div>
            <div style={{ padding: '10px 14px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{r.name}</div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>📍 {r.area_label} · {r.price_tier}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#F5A623' }}>⭐ {r.rating ?? '—'}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C2.coral, background: '#FEF0EA', padding: '1px 6px', borderRadius: 6 }}>AI {r.intelligence_score ?? '—'}</span>
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
