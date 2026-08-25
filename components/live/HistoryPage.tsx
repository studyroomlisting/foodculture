'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

const C = { coral: '#E85D26', green: '#2E9E55', border: '#ede8e2' }

const SIDEBAR = [
  { href: '/account', label: 'My profile' },
  { href: '/account/saved', label: 'Saved content' },
  { href: '/account/activity', label: 'Activity history' },
  { href: '/account/notifications', label: 'Notifications' },
  { href: '/account/privacy', label: 'Privacy' },
  { href: '/account/security', label: 'Security' },
]

// Sample history — in production this would come from a bookings table
const SAMPLE_HISTORY = [
  { id: 1, restaurant: 'Dum Biryani House',    emoji: '🍛', area: 'Koramangala', party: 2, time: '7:30 PM', amount: 672,   date: '5 Jul 2026',  status: 'confirmed' },
  { id: 2, restaurant: 'Coastal Kitchen BLR',  emoji: '🦞', area: 'Indiranagar', party: 4, time: '1:00 PM', amount: 2400,  date: '28 Jun 2026', status: 'confirmed' },
  { id: 3, restaurant: 'Third Wave Coffee BLR',emoji: '☕', area: 'Koramangala', party: 2, time: '10:00 AM',amount: 480,   date: '20 Jun 2026', status: 'confirmed' },
  { id: 4, restaurant: 'Saffron & Spice',      emoji: '🍷', area: 'Indiranagar', party: 2, time: '8:00 PM', amount: 4400,  date: '14 Jun 2026', status: 'cancelled' },
  { id: 5, restaurant: 'Iceberg Desserts',     emoji: '🍦', area: 'Koramangala', party: 1, time: 'Walk-in', amount: 560,   date: '8 Jun 2026',  status: 'confirmed' },
  { id: 6, restaurant: 'Bun Intended',         emoji: '🫓', area: 'Indiranagar', party: 3, time: '9:30 PM', amount: 1100,  date: '1 Jun 2026',  status: 'confirmed' },
]

const STATUS_STYLE: Record<string,{bg:string;color:string}> = {
  confirmed: { bg: '#EAF8EE', color: C.green },
  cancelled:  { bg: '#fef2f2', color: '#dc2626' },
  pending:    { bg: '#FEF9EA', color: '#D4860A' },
}

export default function HistoryPage() {
  const router = useRouter()
  const [initials, setInitials] = useState('U')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [filter, setFilter]     = useState<'all'|'confirmed'|'cancelled'>('all')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/signin'); return }
      setEmail(user.email ?? '')
      const { data: p } = await (supabase as any).from('profiles').select('full_name').eq('id', user.id).single()
      const n = p?.full_name ?? user.email ?? 'U'
      setName(n); setInitials(n.charAt(0).toUpperCase())
    })
  }, [router])

  const shown = filter === 'all' ? SAMPLE_HISTORY : SAMPLE_HISTORY.filter(h => h.status === filter)
  const total = SAMPLE_HISTORY.filter(h => h.status === 'confirmed').reduce((s,h) => s + h.amount, 0)

  return (
    <div style={{ fontFamily: '-apple-system,sans-serif', background: '#fafafa', minHeight: '100vh', color: '#1a1a1a' }}>
      <Nav />
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 22, alignItems: 'start' }}>

        {/* SIDEBAR */}
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', position: 'sticky', top: 80 }}>
          <div style={{ background: 'linear-gradient(135deg,#1a0800,#2d1200)', padding: '24px 20px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.coral, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, border: '3px solid rgba(255,255,255,.2)', marginBottom: '-32px' }}>{initials}</div>
          </div>
          <div style={{ padding: '40px 20px 12px' }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{name || 'Your account'}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{email}</div>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingBottom: 8 }}>
            {SIDEBAR.map(s => (
              <Link key={s.href} href={s.href}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', fontSize: 13, fontWeight: 500, color: (s as any).active ? C.coral : '#555', background: (s as any).active ? '#FEF9F6' : 'transparent', borderLeft: `2px solid ${(s as any).active ? C.coral : 'transparent'}`, textDecoration: 'none' }}>
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {/* MAIN */}
        <div>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total visits', value: SAMPLE_HISTORY.filter(h=>h.status==='confirmed').length },
              { label: 'Total spent', value: `₹${total.toLocaleString('en-IN')}` },
              { label: 'Favourite zone', value: 'Koramangala' },
            ].map(k => (
              <div key={k.label} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.coral }}>{k.value}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Filter + list */}
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Visits &amp; bookings</h2>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['all','confirmed','cancelled'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    style={{ background: filter===f ? C.coral : '#fff', color: filter===f ? '#fff' : '#666', border: `1px solid ${filter===f ? C.coral : C.border}`, borderRadius: 20, padding: '5px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {f === 'all' ? 'All' : f === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                  </button>
                ))}
              </div>
            </div>

            {shown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>No visits found</div>
            ) : shown.map(h => {
              const ss = STATUS_STYLE[h.status]
              return (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: '#FEF0EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }} aria-hidden="true">
                    {h.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{h.restaurant}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                      {h.area} · {h.party} {h.party === 1 ? 'person' : 'people'} · {h.time}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.coral }}>₹{h.amount.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{h.date}</div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: ss.bg, color: ss.color, display: 'inline-block', marginTop: 4 }}>
                      {h.status.charAt(0).toUpperCase() + h.status.slice(1)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
