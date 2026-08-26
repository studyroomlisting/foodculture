'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

const C = { coral: '#E85D26', green: '#2E9E55', border: '#ede8e2', amber: '#D4860A' }

const SIDEBAR = [
  { href: '/account', label: 'My profile', active: true },
  { href: '/account/saved', label: 'Saved content' },
  { href: '/account/activity', label: 'Activity history' },
  { href: '/account/notifications', label: 'Notifications' },
  { href: '/account/privacy', label: 'Privacy' },
  { href: '/account/security', label: 'Security' },
]

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} role="switch" aria-checked={on}
      style={{ width: 44, height: 24, borderRadius: 12, background: on ? C.coral : '#e0e0e0', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
    </button>
  )
}

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser]         = useState<any>(null)
  const [profile, setProfile]   = useState<any>(null)
  const [form, setForm]         = useState({ full_name: '', phone: '', city: 'Bengaluru' })
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const emailUpdated = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('email_updated') === '1'
  const [loading, setLoading]   = useState(true)
  // NOTE: kept separate on purpose — `loadError` is a fatal, page-level
  // failure (can't fetch the profile at all) that replaces the whole page
  // below; `formError` is a recoverable, inline failure (e.g. avatar upload)
  // that should only show a small banner without hiding the rest of the
  // page. They used to be the same state, so an avatar upload error would
  // blank out the entire account page with "Could not load profile".
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [notifs, setNotifs]     = useState({ influencer_posts: true, enquiries: true, ai_scores: true, deals_expiry: true, marketing: false })
  // Same fallback as Nav.tsx: if profiles.role hasn't caught up with reality
  // yet (a Google-OAuth account stuck on 'visitor' — see migration_014),
  // fall back to what they actually own instead of mislabeling them.
  const [fallbackRole, setFallbackRole] = useState<'owner' | 'influencer' | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/signin'); return }
      setUser(user)
      const { data: p, error: pErr } = await (supabase as any).from('profiles').select('id,full_name,phone,city,role,onboarding_complete').eq('id', user.id).single()
      if (pErr || !p) { setLoadError('Could not load your profile. Please refresh.'); setLoading(false); return }
      setProfile(p)
      setForm({ full_name: p.full_name ?? '', phone: p.phone ?? '', city: p.city ?? 'Bengaluru' })
      if (!['owner', 'influencer', 'admin'].includes(p.role)) {
        const [{ count: ownedCount }, { data: creatorRow }] = await Promise.all([
          (supabase as any).from('restaurants').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
          (supabase as any).from('influencers').select('id').eq('profile_id', user.id).maybeSingle(),
        ])
        if ((ownedCount ?? 0) > 0) setFallbackRole('owner')
        else if (creatorRow) setFallbackRole('influencer')
      }
      setLoading(false)
    })
  }, [router])

  async function handleSave() {
    setSaving(true)
    await (supabase as any).from('profiles').update({ full_name: form.full_name, phone: form.phone || null, city: form.city }).eq('id', user.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loadError) return (
    <div style={{ fontFamily: '-apple-system,sans-serif', minHeight: '100vh' }}>
      <Nav />
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Could not load profile</h1>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>{loadError}</p>
        <button onClick={() => window.location.reload()}
          style={{ background: '#E85D26', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Refresh page
        </button>
      </div>
    </div>
  )

  if (loading) return (
    <div style={{ fontFamily: '-apple-system,sans-serif', minHeight: '100vh' }}>
      <Nav />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#aaa', fontSize: 14 }}>Loading your account…</div>
    </div>
  )

  const initials = (form.full_name || user?.email || 'U').charAt(0).toUpperCase()
  const isOwner      = profile?.role === 'owner' || fallbackRole === 'owner'
  const isInfluencer = profile?.role === 'influencer' || fallbackRole === 'influencer'
  const isAdmin       = profile?.role === 'admin'
  const roleBadge = isOwner ? { icon: '🏪', label: 'Restaurant owner', bg: '#FEF0EA', color: C.coral }
    : isInfluencer ? { icon: '✨', label: 'Influencer', bg: '#F3EFFE', color: '#7F77DD' }
    : isAdmin ? { icon: '🛡️', label: 'Admin', bg: '#FEF0EA', color: C.coral }
    : { icon: '🍽️', label: 'Food explorer', bg: '#f5f5f5', color: '#666' }
  // Same role -> destination mapping as Nav.tsx's getDashLink() — a plain
  // visitor has no dashboard of their own, so the link is hidden for them.
  const dashLink = isOwner ? '/dashboard' : isInfluencer ? '/dashboard/influencer' : isAdmin ? '/admin' : null

  return (
    <div style={{ fontFamily: '-apple-system,sans-serif', background: '#fafafa', minHeight: '100vh', color: '#1a1a1a' }}>
      <Nav />
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 22, alignItems: 'start' }}>

        {/* ── SIDEBAR ── */}
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', position: 'sticky', top: 80 }}>
          {/* Avatar */}
          <div style={{ background: 'linear-gradient(135deg,#1a0800,#2d1200)', padding: '24px 20px 0', position: 'relative' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.coral, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, border: '3px solid rgba(255,255,255,.2)', marginBottom: '-32px' }}>
              {initials}
            </div>
          </div>
          <div style={{ padding: '40px 20px 16px' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{form.full_name || 'Your name'}</div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{user?.email}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: roleBadge.bg, color: roleBadge.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
              {roleBadge.icon} {roleBadge.label}
            </div>
          </div>

          {/* Nav items */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, paddingBottom: 8 }}>
            {SIDEBAR.map(s => (
            <Link key={s.href} href={s.href}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', fontSize: 13, fontWeight: 500,
                color: (s as any).active ? C.coral : '#555',
                background: (s as any).active ? '#FEF9F6' : 'transparent',
                borderLeft: `2px solid ${(s as any).active ? C.coral : 'transparent'}`,
                textDecoration: 'none' }}>
              {s.label}
            </Link>
          ))}
            {dashLink && (
              <Link href={dashLink} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 20px', fontSize:13, fontWeight:500, color:'#555', background:'transparent', borderLeft:'2px solid transparent', textDecoration:'none' }}>
                My dashboard
              </Link>
            )}
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', fontSize: 13, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'inherit', borderLeft: '2px solid transparent' }}>
              <i className="ti ti-logout" style={{ fontSize: 16 }} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>

        {/* ── MAIN ── */}
        <div>
          {/* Photo upload */}
      {emailUpdated && (
          <div role="status" style={{ background:'#EAF8EE', border:'1px solid #b6e8c4', borderRadius:10, padding:'10px 16px', fontSize:13, color:'#2E9E55', marginBottom:16 }}>
            ✓ Email address updated successfully.
          </div>
        )}
        <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📸 Profile photo</h2>
        {formError && (
          <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#dc2626', marginBottom: 12 }}>
            {formError}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.coral, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
          <div>
            <label htmlFor="avatar-upload" style={{ display: 'inline-block', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 18px', fontSize: 13, color: '#555', cursor: 'pointer', marginBottom: 6 }}>
              Upload photo
              <input id="avatar-upload" type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0]; if (!file) return
                  setFormError('')
                  if (file.size > 5*1024*1024) { setFormError('Image must be under 5MB.'); return }
                  const fd = new FormData(); fd.append('avatar', file)
                  const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd })
                  if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
                  else { const j = await res.json(); setFormError(j.error || 'Upload failed.') }
                }} />
            </label>
            <div style={{ fontSize: 11, color: '#aaa' }}>JPG, PNG, WebP · max 5MB</div>
          </div>
        </div>
      </section>

      {/* Personal info */}
          <section aria-labelledby="profile-heading" style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <h2 id="profile-heading" style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-user" style={{ color: C.coral }} aria-hidden="true" /> Personal information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label htmlFor="full-name" style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 7 }}>Full name</label>
                <input id="full-name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Your name"
                  style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label htmlFor="email" style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 7 }}>Email address</label>
                <input id="email" value={user?.email ?? ''} disabled
                  style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, background: '#f9f9f9', color: '#888', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label htmlFor="phone" style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 7 }}>Phone number</label>
                <input id="phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210" type="tel"
                  style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label htmlFor="city" style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 7 }}>City</label>
                <select id="city" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', background: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>
                  <option>Bengaluru</option><option>Mumbai</option><option>Delhi</option><option>Hyderabad</option><option>Chennai</option><option>Pune</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ background: C.coral, border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? .7 : 1 }}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              {saved && <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>✓ Saved successfully</span>}
            </div>
          </section>

          {/* Notification prefs */}
          <section aria-labelledby="notif-heading" style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <h2 id="notif-heading" style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-bell" style={{ color: C.coral }} aria-hidden="true" /> Notification preferences
            </h2>
            {([
              ['influencer_posts', 'Influencer posts', 'Get notified when a creator mentions your restaurant'],
              ['enquiries',        'New enquiries',    'Email and push when you receive a new enquiry'],
              ['ai_scores',        'AI Score updates', 'Weekly intelligence score digest'],
              ['deals_expiry',     'Deal expiry alerts','48 hours before your active deal expires'],
              ['marketing',        'Marketing emails', 'Tips, feature updates, and platform news'],
            ] as [keyof typeof notifs, string, string][]).map(([key, label, sub]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{sub}</div>
                </div>
                <Toggle on={notifs[key]} onToggle={() => setNotifs(n => ({ ...n, [key]: !n[key] }))} />
              </div>
            ))}
            <div style={{ paddingTop: 16 }}>
              <button onClick={() => router.push('/account/notifications')}
                style={{ background: '#FEF0EA', border: `1px solid #f5d5c0`, borderRadius: 10, padding: '9px 18px', fontSize: 13, color: C.coral, fontWeight: 600, cursor: 'pointer' }}>
                Manage all notification settings →
              </button>
            </div>
          </section>

          {/* Danger zone */}
          <section aria-labelledby="danger-heading" style={{ background: '#fff', border: `1px solid #fecaca`, borderRadius: 16, padding: 24 }}>
            <h2 id="danger-heading" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-alert-triangle" aria-hidden="true" /> Danger zone
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Delete account</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Permanently remove your account and all personal data. Cannot be undone.</div>
              </div>
              <Link href="/account/delete"
                style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '9px 18px', fontSize: 13, color: '#dc2626', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                Delete account
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  )
}
