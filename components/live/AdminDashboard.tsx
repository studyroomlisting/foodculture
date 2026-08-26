'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { sendListingApprovedEmail, sendListingRejectedEmail } from '@/lib/email'
import Nav from '@/components/Nav'

const C = { coral: '#E85D26', green: '#2E9E55', amber: '#D4860A', red: '#dc2626', border: '#ede8e2' }

type Tab = 'listings' | 'users' | 'influencers' | 'reviews' | 'enquiries' | 'audit' | 'claims'

export default function AdminDashboard({ initialTab = 'listings' }: { initialTab?: string }) {
  const [tab, setTab] = useState<Tab>(initialTab as Tab ?? 'listings')
  const [listings, setListings]   = useState<any[]>([])
  const [creatorListings, setCreatorListings] = useState<any[]>([])
  const [users, setUsers]         = useState<any[]>([])
  const [reviews, setReviews]     = useState<any[]>([])
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [confirm, setConfirm]     = useState<{ action: string; id: string; name: string } | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: l }, { data: ci }, { data: u }, { data: r }, { data: e }, { data: a }] = await Promise.all([
      (supabase as any).from('restaurants').select('id,name,area_label,listing_status,rating,created_at,emoji,owner_id').order('created_at', { ascending: false }),
      // Real creator (influencer) signups only — seed/demo rows have no profile_id.
      (supabase as any).from('influencers').select('id,slug,name,handle,avatar_initials,cuisine_tags,listing_status,rejection_reason,created_at,profile_id').not('profile_id', 'is', null).order('created_at', { ascending: false }),
      (supabase as any).from('profiles').select('id,full_name,role,onboarding_complete,created_at').order('created_at', { ascending: false }),
      (supabase as any).from('reviews').select('id,reviewer_name,rating,body,restaurant_id,created_at').order('created_at', { ascending: false }),
      (supabase as any).from('enquiries').select('*').order('created_at', { ascending: false }),
      (supabase as any).from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
      (supabase as any).from('listing_claims').select('*, restaurant:restaurants(name,emoji), claimant:profiles(full_name)').order('created_at', { ascending: false }),
    ])
    setListings(l ?? []); setCreatorListings(ci ?? []); setUsers(u ?? []); setReviews(r ?? []); setEnquiries(e ?? [])
    const [al, cl] = await Promise.all([(supabase as any).from('audit_logs').select('*').order('created_at',{ascending:false}).limit(50), (supabase as any).from('listing_claims').select('*, restaurant:restaurants(name,emoji), claimant:profiles(full_name)').order('created_at',{ascending:false})])
    setAuditLogs(al.data ?? []); setClaims(cl.data ?? [])
    setLoading(false)
  }

  async function updateListingStatus(id: string, status: string, name: string) {
    await fetch('/api/admin/listing-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: id, status, name }),
    })
    setConfirm(null)
    loadAll()
  }

  async function updateInfluencerStatus(id: string, status: string) {
    await fetch('/api/admin/influencer-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ influencer_id: id, status }),
    })
    setConfirm(null)
    loadAll()
  }

  async function updateClaimStatus(id: string, status: string, restaurantId: string) {
    await (supabase as any).from('listing_claims').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id)
    if (status === 'approved') {
      const claim = claims.find((c:any) => c.id === id)
      if (claim) await (supabase as any).from('restaurants').update({ owner_id: claim.claimant_id }).eq('id', restaurantId)
    }
    await (supabase as any).from('audit_logs').insert([{ action: `claim.${status}`, target_table: 'listing_claims', target_id: id }])
    setClaims(prev => prev.map((c:any) => c.id === id ? { ...c, status } : c))
    setConfirm(null)
  }

  async function deleteReview(id: string) {
    await (supabase as any).from('reviews').delete().eq('id', id)
    await (supabase as any).from('audit_logs').insert([{ action: 'review.deleted', target_table: 'reviews', target_id: id }])
    setConfirm(null)
    loadAll()
  }

  const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    approved:       { bg: '#EAF8EE', color: C.green  },
    pending_review: { bg: '#FEF9EA', color: C.amber  },
    rejected:       { bg: '#fef2f2', color: C.red    },
    draft:          { bg: '#f5f5f5', color: '#888'   },
    suspended:      { bg: '#fef2f2', color: C.red    },
  }

  const tabCounts: Record<Tab, number> = {
    listings:    listings.length,
    users:       users.length,
    influencers: creatorListings.length,
    reviews:     reviews.length,
    enquiries:enquiries.length,
    audit:    auditLogs.length,
    claims:   claims.length,
  }

  async function adminUserAction(userId: string, action: 'suspend' | 'activate') {
    if (action === 'suspend' && !window.confirm('Suspend this user?')) return
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    await loadAll()
  }

  async function adminDeleteUser(userId: string) {
    if (!window.confirm('Delete user permanently? This cannot be undone.')) return
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    await loadAll()
  }

  return (
    <div style={{ fontFamily: "-apple-system,sans-serif", background: '#fafafa', minHeight: '100vh', color: '#1a1a1a' }}>
      <Nav />

      {/* Admin header */}
      <div style={{ background: '#1a1a1a', padding: '20px 24px', color: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>🛡️ Admin Dashboard</h1>
          <nav aria-label="Admin sections" style={{ display:'flex', gap:8, marginTop:10 }}>
            {(['listings','users','reviews','enquiries','claims','audit'] as const).map(s => (
              <Link key={s} href={s==='listings'?'/admin':`/admin/${s}`} style={{ fontSize:12, color:'#888', textDecoration:'none', padding:'4px 10px', borderRadius:12, background:'rgba(255,255,255,.1)' }}>{s}</Link>
            ))}
          </nav>
            <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>FoodCulture AI · Bengaluru</p>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: C.coral }}>{listings.filter(l => l.listing_status === 'pending_review').length}</div><div style={{ color: '#888' }}>Pending</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700 }}>{users.length}</div><div style={{ color: '#888' }}>Users</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700 }}>{listings.filter(l => l.listing_status === 'approved').length}</div><div style={{ color: '#888' }}>Live listings</div></div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: '#fff', borderRadius: 12, padding: 6, border: `1px solid ${C.border}`, width: 'fit-content' }}>
          {(['listings','users','influencers','reviews','enquiries','claims','audit'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ background: tab === t ? C.coral : 'none', color: tab === t ? '#fff' : '#666', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize' }}>
              {t} <span style={{ fontSize: 11, opacity: 0.8 }}>({tabCounts[t]})</span>
            </button>
          ))}
        </div>
        <p style={{textAlign:'right',marginTop:-8,marginBottom:8,fontSize:12}}>
          <Link href="/admin/permissions" style={{color:'#888',textDecoration:'none'}}>🔐 View permissions matrix →</Link>
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Loading…</div>
        ) : (
          <>
            {/* LISTINGS */}
            {tab === 'listings' && (
              <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>All listings</span>
                  <Link href="/dashboard/listings/new" style={{ background: C.coral, color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>+ Add listing</Link>
                </div>
                {listings.map(l => {
                  const ss = STATUS_STYLE[l.listing_status] ?? STATUS_STYLE.draft
                  return (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: `1px solid #f5f0eb` }}>
                      <span style={{ fontSize: 28 }}>{l.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{l.name}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>{l.area_label} · ⭐ {l.rating} · {new Date(l.created_at).toLocaleDateString('en-IN')}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: ss.bg, color: ss.color }}>{l.listing_status.replace('_', ' ')}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {l.listing_status === 'pending_review' && (<>
                          <button onClick={() => setConfirm({ action: 'approved', id: l.id, name: l.name })}
                            style={{ background: '#EAF8EE', color: C.green, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                          <button onClick={() => setConfirm({ action: 'rejected', id: l.id, name: l.name })}
                            style={{ background: '#fef2f2', color: C.red, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                        </>)}
                        {l.listing_status === 'approved' && (
                          <button onClick={() => setConfirm({ action: 'suspended', id: l.id, name: l.name })}
                            style={{ background: '#FEF9EA', color: C.amber, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Suspend</button>
                        )}
                        <Link href={`/restaurants/${l.id}`} style={{ background: '#f5f0eb', color: '#666', borderRadius: 6, padding: '5px 12px', fontSize: 12, textDecoration: 'none' }}>View</Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* USERS */}
            {tab === 'users' && (
              <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontSize: 14 }}>All users</div>
                {users.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: `1px solid #f5f0eb` }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEF0EA', color: C.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      {(u.full_name ?? 'U').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{u.full_name ?? 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>Joined {new Date(u.created_at).toLocaleDateString('en-IN')} · Onboarding: {u.onboarding_complete ? '✓' : 'Pending'}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: u.role === 'admin' ? '#1a1a1a' : u.role === 'owner' ? '#FEF0EA' : '#f5f5f5', color: u.role === 'admin' ? '#fff' : u.role === 'owner' ? C.coral : '#888', textTransform: 'capitalize' }}>{u.role}</span>
                  {u.suspended_at && (
                    <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:'#fef2f2',color:'#dc2626',fontWeight:600,marginLeft:4}}>⚠ Suspended</span>
                  )}
                  <div style={{marginLeft:'auto',display:'flex',gap:5,flexShrink:0}}>
                    <Link href={`/admin/users/${u.id}`} style={{fontSize:11,background:'#f5f5f5',borderRadius:6,padding:'4px 10px',color:'#555',textDecoration:'none'}}>View</Link>
                    <button onClick={() => adminUserAction(u.id, u.suspended_at ? 'activate' : 'suspend')}
                      style={{fontSize:11,background:u.suspended_at?'#EAF8EE':'#FEF9EA',border:`1px solid ${u.suspended_at?'#b6e8c4':'#f5d5a0'}`,borderRadius:6,padding:'4px 10px',color:u.suspended_at?C.green:C.amber,cursor:'pointer',fontFamily:'inherit'}}>
                      {u.suspended_at ? 'Activate' : 'Suspend'}
                    </button>
                    <button onClick={() => adminDeleteUser(u.id)}
                      style={{fontSize:11,background:'#fef2f2',border:'1px solid #fecaca',borderRadius:6,padding:'4px 10px',color:'#dc2626',cursor:'pointer',fontFamily:'inherit'}}>
                      Delete
                    </button>
                  </div>
                  </div>
                ))}
              </div>
            )}

            
            {/* INFLUENCERS (FREELANCERS) — real signups from the "Food Creator" wizard,
                which land in `influencers` as pending_review until approved here. */}
            {tab === 'influencers' && (
              <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontSize: 14 }}>
                  Creator listings — {creatorListings.filter((c:any)=>c.listing_status==='pending_review').length} pending review
                </div>
                {creatorListings.length===0
                  ? <div style={{textAlign:'center',padding:40,color:'#aaa',fontSize:14}}>No creators registered yet.</div>
                  : creatorListings.map((c:any) => {
                    const ss = STATUS_STYLE[c.listing_status] ?? STATUS_STYLE.draft
                    return (
                      <div key={c.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 20px',borderBottom:`1px solid #f5f0eb`}}>
                        <div style={{width:36,height:36,borderRadius:'50%',background:'#F3EFFE',color:'#7F77DD',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,flexShrink:0}}>
                          {c.avatar_initials || (c.name||'C').charAt(0).toUpperCase()}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:700}}>{c.name||'—'}</div>
                          <div style={{fontSize:11,color:'#888',marginTop:2}}>
                            {c.handle?`@${c.handle}`:'No handle'} · Joined {new Date(c.created_at).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}
                          </div>
                        </div>
                        <span style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:10,background:ss.bg,color:ss.color,flexShrink:0}}>{c.listing_status.replace('_',' ')}</span>
                        <div style={{display:'flex',gap:6,flexShrink:0}}>
                          {c.listing_status === 'pending_review' && (<>
                            <button onClick={() => setConfirm({ action: 'inf_approved', id: c.id, name: c.name })}
                              style={{ background: '#EAF8EE', color: C.green, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                            <button onClick={() => setConfirm({ action: 'inf_rejected', id: c.id, name: c.name })}
                              style={{ background: '#fef2f2', color: C.red, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                          </>)}
                          {c.slug && <Link href={`/influencers/${c.slug}`} style={{ background: '#f5f0eb', color: '#666', borderRadius: 6, padding: '5px 12px', fontSize: 12, textDecoration: 'none' }}>View</Link>}
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            )}

{/* REVIEWS */}
            {tab === 'reviews' && (
              <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontSize: 14 }}>All reviews</div>
                {reviews.map(r => (
                  <div key={r.id} style={{ padding: '14px 20px', borderBottom: `1px solid #f5f0eb` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{r.reviewer_name} · {'⭐'.repeat(r.rating)}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setConfirm({ action: 'delete_review', id: r.id, name: r.reviewer_name })}
                          style={{ background: '#fef2f2', color: C.red, border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>Remove</button>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: '#555', margin: 0, lineHeight: 1.5 }}>{r.body}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ENQUIRIES */}
            {tab === 'enquiries' && (
              <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontSize: 14 }}>All enquiries</div>
                {enquiries.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>No enquiries yet</div> : enquiries.map(e => (
                  <div key={e.id} style={{ padding: '14px 20px', borderBottom: `1px solid #f5f0eb` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{e.sender_name} · {e.sender_email}</span>
                      <span style={{ fontSize: 11, color: '#aaa' }}>{new Date(e.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#555', margin: 0 }}>{e.message}</p>
                  </div>
                ))}
              </div>
            )}


            {/* CLAIMS */}
            {tab === 'claims' && (
              <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, fontWeight:600, fontSize:14 }}>
                  Listing claim requests
                </div>
                {claims.length === 0
                  ? <div style={{ padding:40, textAlign:'center', color:'#aaa' }}>No claim requests yet</div>
                  : claims.map((c:any) => {
                    const ss = c.status === 'pending' ? { bg:'#FEF9EA', color:C.amber } : c.status === 'approved' ? { bg:'#EAF8EE', color:C.green } : { bg:'#fef2f2', color:'#dc2626' }
                    return (
                      <div key={c.id} style={{ padding:'16px 20px', borderBottom:`1px solid #f5f0eb` }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                          <div>
                            <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>
                              {c.restaurant?.emoji} {c.restaurant?.name}
                            </div>
                            <div style={{ fontSize:13, color:'#888' }}>
                              Claimed by: <strong>{c.claimant?.full_name ?? 'Unknown'}</strong>
                            </div>
                            <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>
                              {new Date(c.created_at).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                          <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:10, background:ss.bg, color:ss.color }}>{c.status}</span>
                        </div>
                        {c.evidence_notes && (
                          <p style={{ fontSize:13, color:'#555', background:'#fafafa', borderRadius:8, padding:'10px 14px', margin:'0 0 12px' }}>{c.evidence_notes}</p>
                        )}
                        {c.status === 'pending' && (
                          <div style={{ display:'flex', gap:8 }}>
                            <button onClick={() => setConfirm({ action:'claim_approved', id:c.id, name:c.restaurant?.name ?? '' })}
                              style={{ background:'#EAF8EE', color:C.green, border:'none', borderRadius:6, padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                              Approve & assign owner
                            </button>
                            <button onClick={() => setConfirm({ action:'claim_rejected', id:c.id, name:c.restaurant?.name ?? '' })}
                              style={{ background:'#fef2f2', color:'#dc2626', border:'none', borderRadius:6, padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })
                }
              </div>
            )}
            {/* AUDIT */}
            {tab === 'audit' && (
              <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontSize: 14 }}>Audit log (last 50)</div>
                {auditLogs.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: `1px solid #f5f0eb`, fontSize: 13 }}>
                    <code style={{ background: '#f5f0eb', padding: '2px 8px', borderRadius: 6, fontSize: 11, color: '#666', flexShrink: 0 }}>{a.action}</code>
                    <span style={{ color: '#888' }}>{a.target_table} · {a.target_id?.slice(0, 8)}</span>
                    <span style={{ marginLeft: 'auto', color: '#aaa', fontSize: 11 }}>{new Date(a.created_at).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <div onClick={() => setConfirm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 28, width: 360, maxWidth: '90vw' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              {confirm.action === 'delete_review' ? 'Remove review?' : confirm.action.startsWith('inf_') ? `${confirm.action.replace('inf_', '')} creator?` : `${confirm.action.replace('_', ' ')} listing?`}
            </div>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>
              {confirm.action === 'delete_review'
                ? `Remove review by "${confirm.name}"? This cannot be undone.`
                : confirm.action.startsWith('inf_')
                ? `Are you sure you want to mark "${confirm.name}" as ${confirm.action.replace('inf_', '')}?`
                : `Are you sure you want to mark "${confirm.name}" as ${confirm.action}?`}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 0', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { if (confirm.action === 'delete_review') deleteReview(confirm.id); else if (confirm.action.startsWith('inf_')) updateInfluencerStatus(confirm.id, confirm.action.replace('inf_','')); else if (confirm.action.startsWith('claim_')) updateClaimStatus(confirm.id, confirm.action.replace('claim_',''), confirm.id); else updateListingStatus(confirm.id, confirm.action, confirm.name) }}
                style={{ flex: 1, background: confirm.action === 'approved' || confirm.action === 'inf_approved' ? C.green : C.red, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
