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
  { href: '/account/notifications', label: 'Notifications', active: true },
  { href: '/account/privacy', label: 'Privacy' },
  { href: '/account/security', label: 'Security' },
]

const PREFS = [
  {
    group: 'Restaurant activity',
    items: [
      { key: 'influencer_posts',   label: 'Influencer posts',     sub: 'When a creator mentions your restaurant or one you follow', default: true  },
      { key: 'new_reviews',        label: 'New reviews',          sub: 'When a new review is posted for your restaurant',          default: true  },
      { key: 'enquiries',          label: 'New enquiries',        sub: 'Email and push when you receive a new enquiry',            default: true  },
      { key: 'ai_score_changes',   label: 'AI Score updates',     sub: 'When your Intelligence Score changes significantly',       default: true  },
    ],
  },
  {
    group: 'Deals & offers',
    items: [
      { key: 'deal_expiry',        label: 'Deal expiry alerts',   sub: '48 hours before your active deal expires',                 default: true  },
      { key: 'new_deals',          label: 'New deals near you',   sub: 'When restaurants you follow add new exclusive deals',      default: false },
    ],
  },
  {
    group: 'Platform',
    items: [
      { key: 'trending_alerts',    label: 'Trending alerts',      sub: 'When a restaurant or dish you saved goes viral',           default: true  },
      { key: 'weekly_digest',      label: 'Weekly digest',        sub: 'Summary of what\'s trending in Bengaluru every Monday',    default: true  },
      { key: 'marketing',          label: 'Marketing & updates',  sub: 'New features, tips, and platform news',                    default: false },
    ],
  },
]

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} role="switch" aria-checked={on}
      style={{ width: 44, height: 24, borderRadius: 12, background: on ? C.coral : '#e0e0e0', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
    </button>
  )
}

export default function NotificationPrefsPage() {
  const router = useRouter()
  const [initials, setInitials] = useState('U')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [saved, setSaved]       = useState(false)
  const [channel, setChannel]   = useState<'email'|'push'|'both'>('both')
  const [prefs, setPrefs]       = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PREFS.flatMap(g => g.items).map(i => [i.key, i.default]))
  )

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/signin'); return }
      setEmail(user.email ?? '')
      const { data: p } = await (supabase as any).from('profiles').select('full_name').eq('id', user.id).single()
      const n = p?.full_name ?? user.email ?? 'U'
      setName(n); setInitials(n.charAt(0).toUpperCase())
    })
  }, [router])

  function togglePref(key: string) {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function savePrefs() {
    // In production: persist to a user_notification_prefs table
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const enabledCount = Object.values(prefs).filter(Boolean).length

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
          {/* Channel picker */}
          <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>🔔 Notification preferences</h2>
                <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{enabledCount} of {Object.keys(prefs).length} notifications enabled</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['email','push','both'] as const).map(ch => (
                  <button key={ch} onClick={() => setChannel(ch)}
                    style={{ background: channel === ch ? C.coral : '#fff', color: channel === ch ? '#fff' : '#666', border: `1px solid ${channel === ch ? C.coral : C.border}`, borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {ch === 'email' ? '✉️ Email' : ch === 'push' ? '📱 Push' : '📲 Both'}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Preference groups */}
          {PREFS.map(group => (
            <section key={group.group} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 16 }}>{group.group}</h3>
              {group.items.map((item, i) => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: i < group.items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{item.sub}</div>
                  </div>
                  <Toggle on={prefs[item.key]} onToggle={() => togglePref(item.key)} />
                </div>
              ))}
            </section>
          ))}

          {/* Save */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={savePrefs}
              style={{ background: C.coral, border: 'none', borderRadius: 10, padding: '11px 28px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Save preferences
            </button>
            {saved && <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>✓ Saved successfully</span>}
            <button onClick={() => setPrefs(Object.fromEntries(PREFS.flatMap(g => g.items).map(i => [i.key, false])))}
              style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 20px', fontSize: 13, color: '#666', cursor: 'pointer' }}>
              Disable all
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
