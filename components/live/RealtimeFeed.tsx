'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ActivityFeedItem } from '@/types/database'

export default function RealtimeFeed({ initial }: { initial: ActivityFeedItem[] }) {
  const [feed, setFeed] = useState<ActivityFeedItem[]>(initial)

  useEffect(() => {
    const channel = supabase
      .channel('activity-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_feed' },
        (payload) => {
          setFeed(prev => [payload.new as ActivityFeedItem, ...prev].slice(0, 10))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <section aria-labelledby="live-feed" style={{ padding:'28px 24px', maxWidth:1000, margin:'0 auto' }}>
      <h2 id="live-feed" style={{ fontSize:16, fontWeight:600, marginBottom:16 }}>
        ⚡ Live activity feed
        <span style={{ display:'inline-flex', alignItems:'center', gap:4, marginLeft:10, fontSize:11, color:'#2E9E55', fontWeight:500 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#2E9E55', display:'inline-block', animation:'pulse 2s infinite' }} aria-hidden="true" />
          Live
        </span>
      </h2>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      {feed.map(item => (
        <div key={item.id} role="listitem" style={{ display:'flex', alignItems:'center', gap:10, background:'#FEF9F6', border:'1px solid #f5d5c0', borderRadius:10, padding:'12px 14px', marginBottom:8 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:item.dot_color, flexShrink:0, display:'inline-block' }} aria-hidden="true" />
          <span style={{ fontSize:13, flex:1 }} dangerouslySetInnerHTML={{ __html: item.message }} />
          <time style={{ fontSize:10, color:'#aaa', flexShrink:0 }} dateTime={item.created_at}>
            {new Date(item.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
          </time>
        </div>
      ))}
    </section>
  )
}
