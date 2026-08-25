'use client'
import { useEffect, useState } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { PageLoader } from '@/components/Skeleton'
import { supabase } from '@/lib/supabase'
import { getActivityFeed } from '@/lib/queries'
import type { ActivityFeedItem } from '@/types/database'

const C = { coral:'#E85D26', green:'#2E9E55', border:'#ede8e2' }

const SYSTEM: any[] = [
  { id:'sys-1', icon:'🔥', title:'Viral alert', body:'Dum Biryani House is trending — 3 influencer posts in 2 hours', dot_color:C.coral, created_at: new Date(Date.now()-2*60000).toISOString() },
  { id:'sys-2', icon:'📈', title:'Score update', body:'Your AI Intelligence Score increased by +12 this week', dot_color:C.green, created_at: new Date(Date.now()-15*60000).toISOString() },
  { id:'sys-3', icon:'🎟', title:'Deal expiring', body:'FC-DBH-20 expires in 6 hours — 3 redemptions so far', dot_color:'#D4860A', created_at: new Date(Date.now()-60*60000).toISOString() },
  { id:'sys-4', icon:'✨', title:'New influencer match', body:'Rahul Kitchens covers your cuisine type — view profile to connect', dot_color:'#7F77DD', created_at: new Date(Date.now()-3*3600000).toISOString() },
  { id:'sys-5', icon:'⭐', title:'New review', body:"Arjun K. left a 5-star review: \"Best biryani in Bengaluru\"", dot_color:C.coral, created_at: new Date(Date.now()-5*3600000).toISOString() },
]

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime()
  const m = Math.floor(d/60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m/60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

export default function NotificationsPage() {
  const [feed, setFeed]     = useState<ActivityFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<'all'|'unread'>('all')
  const [readIds, setReadIds] = useState<Set<string>>(new Set(['sys-3','sys-4','sys-5']))
  const [userId, setUserId]   = useState<string|null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data:{ user } }) => setUserId(user?.id ?? null))
    getActivityFeed(10).then(d => { setFeed(d); setLoading(false) })
  }, [])

  async function markRead(id: string) {
    setReadIds(prev => new Set([...prev, id]))
    // Write to DB for real notification rows (non-system)
    if (!id.startsWith('sys-') && userId) {
      await (supabase as any).from('notifications').update({ read: true }).eq('id', id).eq('user_id', userId)
    }
  }

  async function markAllRead() {
    const allIds = allNotifs.map(n => n.id)
    setReadIds(new Set(allIds))
    // Bulk update real DB rows
    if (userId) {
      await (supabase as any).from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    }
  }

  const allNotifs = [
    ...SYSTEM,
    ...feed.map(f => ({ id:f.id, icon:'⚡', title:'Live update', body:f.message.replace(/<[^>]*>/g,''), dot_color:f.dot_color, created_at:f.created_at }))
  ].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const shown = filter === 'unread' ? allNotifs.filter(n => !readIds.has(n.id)) : allNotifs
  const unreadCount = allNotifs.filter(n => !readIds.has(n.id)).length

  return (
    <div style={{ fontFamily:"-apple-system,sans-serif", background:'#fafafa', minHeight:'100vh', color:'#1a1a1a' }}>
      <Nav />
      <div style={{ background:'#fff', padding:'24px 24px 0', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:700, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>🔔 Notifications</h1>
              {unreadCount > 0 && <p style={{ fontSize:13, color:C.coral, marginTop:4, fontWeight:500 }}>{unreadCount} unread</p>}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:20, padding:'7px 16px', fontSize:12, color:'#666', cursor:'pointer' }}>
                Mark all read
              </button>
            )}
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {[['all','All'],['unread','Unread']].map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v as any)}
                style={{ background:filter===v ? C.coral:'#fff', color:filter===v?'#fff':'#666', border:`1px solid ${filter===v?C.coral:C.border}`, borderRadius:20, padding:'6px 16px', fontSize:12, fontWeight:500, cursor:'pointer', marginBottom:-1 }}>
                {l}{v==='unread'&&unreadCount>0?` (${unreadCount})`:''}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth:700, margin:'0 auto', padding:'20px 24px' }}>
        {loading ? <PageLoader /> : shown.length === 0 ? (
          <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🎉</div>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>All caught up!</div>
            <p style={{ fontSize:13 }}>No unread notifications.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {shown.map(n => {
              const isUnread = !readIds.has(n.id)
              return (
                <div key={n.id} onClick={() => markRead(n.id)} role="listitem"
                  style={{ background:isUnread?'#FFF9F6':'#fff', border:`1px solid ${isUnread?'#f5d5c0':C.border}`, borderRadius:14, padding:'16px 18px', display:'flex', alignItems:'flex-start', gap:14, cursor:'pointer' }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:isUnread?'#FEF0EA':'#f5f5f5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }} aria-hidden="true">
                    {n.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:13, fontWeight:600 }}>{n.title}</span>
                      {isUnread && <span style={{ width:7, height:7, borderRadius:'50%', background:n.dot_color, display:'inline-block' }} aria-label="Unread" />}
                    </div>
                    <div style={{ fontSize:13, color:'#555', lineHeight:1.5 }}>{n.body}</div>
                    <time style={{ fontSize:11, color:'#aaa', marginTop:6, display:'block' }} dateTime={n.created_at}>{timeAgo(n.created_at)}</time>
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
