'use client'
import { useEffect, useState } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { PageLoader } from '@/components/Skeleton'
import { supabase } from '@/lib/supabase'

const C = { coral:'#E85D26', green:'#2E9E55', amber:'#D4860A', border:'#ede8e2' }

const STATUS_STYLE: Record<string,{ bg:string; color:string }> = {
  new:     { bg:'#FEF0EA', color:C.coral  },
  read:    { bg:'#f5f5f5', color:'#888'   },
  replied: { bg:'#EAF8EE', color:C.green  },
  spam:    { bg:'#fef2f2', color:'#dc2626' },
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [selectedRest, setSelectedRest] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [replyId, setReplyId] = useState<string|null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: rests } = await (supabase as any).from('restaurants').select('id,name,emoji').eq('owner_id', user.id)
      setRestaurants(rests ?? [])
      const ids = (rests ?? []).map((r:any) => r.id)
      if (ids.length > 0) {
        const { data: enqs } = await (supabase as any).from('enquiries')
          .select('*').in('restaurant_id', ids).order('created_at', { ascending: false })
        setEnquiries(enqs ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  async function markRead(id: string) {
    await (supabase as any).from('enquiries').update({ status: 'read' }).eq('id', id)
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: 'read' } : e))
  }

  async function markSpam(id: string) {
    await (supabase as any).from('enquiries').update({ status: 'spam' }).eq('id', id)
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: 'spam' } : e))
  }

  async function sendReply(enquiry: any) {
    setSending(true)
    // Mark as replied in DB
    await (supabase as any).from('enquiries').update({ status: 'replied', replied_at: new Date().toISOString() }).eq('id', enquiry.id)
    setEnquiries(prev => prev.map(e => e.id === enquiry.id ? { ...e, status: 'replied', replied_at: new Date().toISOString() } : e))
    setSending(false)
    setReplyId(null)
    setReplyText('')
  }

  const filtered = selectedRest === 'all' ? enquiries : enquiries.filter(e => e.restaurant_id === selectedRest)
  const newCount = enquiries.filter(e => e.status === 'new').length

  return (
    <div style={{ fontFamily:"-apple-system,sans-serif", background:'#fafafa', minHeight:'100vh', color:'#1a1a1a' }}>
      <Nav />
      <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>📬 Enquiries</h1>
            {newCount > 0 && <p style={{ fontSize:13, color:C.coral, marginTop:4 }}>{newCount} new enquir{newCount === 1 ? 'y' : 'ies'}</p>}
          </div>
          {restaurants.length > 1 && (
            <select value={selectedRest} onChange={e => setSelectedRest(e.target.value)}
              style={{ border:`1px solid ${C.border}`, borderRadius:20, padding:'7px 14px', fontSize:13, outline:'none', cursor:'pointer' }}>
              <option value="all">All restaurants</option>
              {restaurants.map(r => <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>)}
            </select>
          )}
        </div>

        {loading ? <PageLoader /> : filtered.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${C.border}`, padding:60, textAlign:'center', color:'#aaa' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <p>No enquiries yet. They'll appear here when visitors contact your restaurant.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map(e => {
              const ss = STATUS_STYLE[e.status] ?? STATUS_STYLE.new
              const rest = restaurants.find(r => r.id === e.restaurant_id)
              return (
                <div key={e.id} style={{ background:'#fff', border:`1px solid ${e.status==='new'?'#f5d5c0':C.border}`, borderRadius:14, padding:20 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                        <div style={{ width:36, height:36, borderRadius:'50%', background:'#FEF0EA', color:C.coral, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, flexShrink:0 }} aria-hidden="true">
                          {e.sender_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize:14, fontWeight:600 }}>{e.sender_name}</div>
                          <div style={{ fontSize:12, color:'#888' }}>
                            <a href={`mailto:${e.sender_email}`} style={{ color:C.coral, textDecoration:'none' }}>{e.sender_email}</a>
                            {e.sender_phone && <span> · {e.sender_phone}</span>}
                          </div>
                        </div>
                      </div>
                      {rest && <div style={{ fontSize:11, color:'#aaa', marginLeft:46 }}>{rest.emoji} {rest.name}</div>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:10, background:ss.bg, color:ss.color }}>{e.status}</span>
                      <time style={{ fontSize:11, color:'#aaa' }} dateTime={e.created_at}>
                        {new Date(e.created_at).toLocaleDateString('en-IN',{ day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </time>
                    </div>
                  </div>

                  <p style={{ fontSize:14, color:'#333', lineHeight:1.6, margin:'0 0 14px', padding:'12px 14px', background:'#fafafa', borderRadius:10 }}>{e.message}</p>

                  {e.replied_at && (
                    <div style={{ fontSize:12, color:C.green, marginBottom:10 }}>
                      ✓ Replied on {new Date(e.replied_at).toLocaleDateString('en-IN')}
                    </div>
                  )}

                  {/* Reply area */}
                  {replyId === e.id ? (
                    <div>
                      <div style={{ fontSize:12, color:'#888', marginBottom:6 }}>
                        Replying to <strong>{e.sender_name}</strong> at <a href={`mailto:${e.sender_email}`} style={{ color:C.coral }}>{e.sender_email}</a>
                        <span style={{ fontSize:11, color:'#aaa', marginLeft:6 }}>(reply sends via your email client)</span>
                      </div>
                      <textarea value={replyText} onChange={e2 => setReplyText(e2.target.value)} rows={4}
                        placeholder="Type your reply..."
                        style={{ width:'100%', boxSizing:'border-box', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', fontSize:13, outline:'none', resize:'vertical', marginBottom:10 }} />
                      <div style={{ display:'flex', gap:8 }}>
                        <a href={`mailto:${e.sender_email}?subject=Re: Your enquiry&body=${encodeURIComponent(replyText)}`}
                          onClick={() => sendReply(e)}
                          style={{ background:C.coral, color:'#fff', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:600, textDecoration:'none', display:'inline-block' }}>
                          {sending ? 'Saving…' : 'Open in mail & mark replied'}
                        </a>
                        <button onClick={() => { setReplyId(null); setReplyText('') }}
                          style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'9px 18px', fontSize:13, color:'#666', cursor:'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => { setReplyId(e.id); markRead(e.id) }}
                        style={{ background:C.coral, color:'#fff', border:'none', borderRadius:10, padding:'8px 18px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        ↩ Reply
                      </button>
                      {e.status === 'new' && (
                        <button onClick={() => markRead(e.id)}
                          style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 14px', fontSize:12, color:'#666', cursor:'pointer' }}>
                          Mark read
                        </button>
                      )}
                      {e.status !== 'spam' && (
                        <button onClick={() => markSpam(e.id)}
                          style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 14px', fontSize:12, color:'#dc2626', cursor:'pointer' }}>
                          Mark spam
                        </button>
                      )}
                    </div>
                  )}
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
