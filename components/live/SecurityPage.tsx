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
  { href: '/account/security', label: 'Security', active: true },
]

const LOGIN_HISTORY = [
  { device: 'iPhone 15 Pro', location: 'Bengaluru, IN', time: '2 hours ago',  trusted: true  },
  { device: 'Chrome · MacBook Pro', location: 'Bengaluru, IN', time: 'Yesterday 9:42 AM', trusted: true },
  { device: 'Chrome · MacBook Pro', location: 'Bengaluru, IN', time: '6 Jul 2026',  trusted: true  },
  { device: 'Unknown browser', location: 'Mumbai, IN', time: '5 Jul 2026', trusted: false },
]

export default function SecurityPage() {
  const router = useRouter()
  const [initials, setInitials] = useState('U')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [twoFA, setTwoFA]       = useState(false)
  const [changing, setChanging] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailMsg, setEmailMsg] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [deactivating, setDeactivating] = useState(false)
  const [deactivateReason, setDeactivateReason] = useState('')
  const [pwForm, setPwForm]     = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg]       = useState('')
  const [pwErr, setPwErr]       = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/signin'); return }
      setEmail(user.email ?? '')
      const { data: p } = await (supabase as any).from('profiles').select('full_name').eq('id', user.id).single()
      const n = p?.full_name ?? user.email ?? 'U'
      setName(n); setInitials(n.charAt(0).toUpperCase())
    })
  }, [router])

  async function handlePasswordChange() {
    setPwErr(''); setPwMsg('')
    if (!pwForm.current) { setPwErr('Please enter your current password.'); return }
    if (pwForm.next.length < 8) { setPwErr('New password must be at least 8 characters.'); return }
    if (pwForm.next === pwForm.current) { setPwErr('New password must differ from current.'); return }
    if (pwForm.next !== pwForm.confirm) { setPwErr('Passwords do not match.'); return }
    setChanging(true)
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u?.email) { setPwErr('Session expired. Please sign in again.'); setChanging(false); return }
    const { error: verifyErr } = await supabase.auth.signInWithPassword({ email: u.email, password: pwForm.current })
    if (verifyErr) { setPwErr('Current password is incorrect.'); setChanging(false); return }
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    if (error) { setPwErr(error.message); setChanging(false); return }
    setPwMsg('Password updated successfully.'); setPwForm({ current: '', next: '', confirm: '' })
    setChanging(false)
  }

  async function handleEmailChange() {
    setEmailErr(''); setEmailMsg('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setEmailErr('Invalid email address.'); return }
    const res = await fetch('/api/profile/email', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: newEmail }) })
    const j = await res.json()
    if (res.ok) { setEmailMsg(j.message || 'Verification email sent.'); setNewEmail('') }
    else setEmailErr(j.error || 'Failed to update email.')
  }

  async function handleDeactivate() {
    if (!confirm('Deactivate your account? You can reactivate by signing back in.')) return
    setDeactivating(true)
    await fetch('/api/account/deactivate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ reason: deactivateReason }) })
    setDeactivating(false)
    window.location.href = '/'
  }

  async function signOutAll() {
    await supabase.auth.signOut({ scope: 'global' })
    router.push('/auth/signin')
  }

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
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', fontSize: 13, fontWeight: 500, color: s.active ? C.coral : '#555', background: s.active ? '#FEF9F6' : 'transparent', borderLeft: `2px solid ${s.active ? C.coral : 'transparent'}`, textDecoration: 'none' }}>
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {/* MAIN */}
        <div>
          {/* Change password */}
          <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-lock" style={{ color: C.coral }} /> Change password
            </h2>
            <div style={{ display: 'grid', gap: 14, maxWidth: 400 }}>
              {[['current','Current password'],['next','New password'],['confirm','Confirm new password']].map(([key,label]) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>{label}</label>
                  <input type="password" value={pwForm[key as keyof typeof pwForm]}
                    onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                </div>
              ))}
              {pwErr && <div style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>{pwErr}</div>}
              {pwMsg && <div style={{ fontSize: 12, color: C.green, background: '#EAF8EE', border: `1px solid #b6e8c4`, borderRadius: 8, padding: '8px 12px' }}>{pwMsg}</div>}
              <button onClick={handlePasswordChange} disabled={changing}
                style={{ background: C.coral, border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: 'fit-content', opacity: changing ? .7 : 1 }}>
                {changing ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </section>

          {/* 2FA + connected */}
          <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-shield-check" style={{ color: C.coral }} /> Security settings
            </h2>
            {[
              { icon: '📱', label: 'Two-factor authentication', sub: 'Adds an extra layer of security to your account',
                action: <button onClick={() => setTwoFA(!twoFA)} style={{ background: twoFA ? '#EAF8EE' : '#FEF0EA', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 600, color: twoFA ? C.green : C.coral, cursor: 'pointer' }}>{twoFA ? 'Enabled ✓' : 'Enable 2FA'}</button> },
              { icon: '🔗', label: 'Google account', sub: `${email} is connected`,
                action: <span style={{ fontSize: 12, fontWeight: 600, color: C.green, background: '#EAF8EE', padding: '5px 12px', borderRadius: 8 }}>Connected ✓</span> },
              { icon: '💻', label: 'Active sessions', sub: '2 active sessions (this device + 1 other)',
                action: <button onClick={signOutAll} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}>Sign out all</button> },
            ].map((row, i, arr) => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 22 }} aria-hidden="true">{row.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{row.label}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{row.sub}</div>
                  </div>
                </div>
                {row.action}
              </div>
            ))}
          </section>

          {/* Login history */}
          <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-history" style={{ color: C.coral }} /> Login history
            </h2>
            {LOGIN_HISTORY.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < LOGIN_HISTORY.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: h.trusted ? 600 : 700, color: h.trusted ? '#1a1a1a' : '#dc2626' }}>
                    {!h.trusted && '⚠️ '}{h.device}
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{h.location} · {h.time}</div>
                </div>
                {!h.trusted && (
                  <button style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}>Block</button>
                )}
              </div>
            ))}
          </section>
        </div>
      </div>
      <Footer />
    </div>
  )
}
