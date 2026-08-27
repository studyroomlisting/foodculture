'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const C = { coral: '#E85D26', border: '#ede8e2', error: '#dc2626', green: '#2E9E55' }

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Uppercase letter',       ok: /[A-Z]/.test(password) },
    { label: 'Number',                 ok: /[0-9]/.test(password) },
    { label: 'Special character',      ok: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter(c => c.ok).length
  const barColor = score <= 1 ? '#dc2626' : score === 2 ? '#D4860A' : score === 3 ? '#F5A623' : C.green
  const label    = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong'

  if (!password) return null
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= score ? barColor : '#e0e0e0', transition: 'background .2s' }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: barColor, fontWeight: 600 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
        {checks.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: c.ok ? C.green : '#aaa' }}>
            <span>{c.ok ? '✓' : '○'}</span>{c.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword]     = useState('')
  const [confirm,  setConfirm]      = useState('')
  const [loading,  setLoading]      = useState(false)
  const [error,    setError]        = useState('')
  const [done,     setDone]         = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [linkExpired, setLinkExpired]   = useState(false)

  useEffect(() => {
    // Primary: listen for PASSWORD_RECOVERY event (most reliable for reset links)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // A real PASSWORD_RECOVERY session always wins, even if it fires
        // after the 800ms fallback below already marked the link expired
        // (slow connections could hit that race before this event arrived).
        setHasSession(true)
        setLinkExpired(false)
      } else if (event === 'SIGNED_OUT' && !session) {
        setLinkExpired(true)
      }
    })

    // Fallback: check existing session (for page refreshes)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasSession(true)
      } else {
        // Give onAuthStateChange a moment to fire before marking expired —
        // re-check hasSession too (via functional update) so a
        // PASSWORD_RECOVERY event that already landed isn't overridden.
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) { setHasSession(true); return }
            setHasSession(already => {
              if (!already) setLinkExpired(true)
              return already
            })
          })
        }, 800)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    // Block common passwords
    const COMMON = ['password','12345678','password123','qwerty123','letmein1','football1']
    if (COMMON.includes(password.toLowerCase())) {
      setError('This password is too common. Please choose a more secure one.')
      return
    }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    // Log the password change in audit logs. Best-effort only — wrapped in
    // try/catch because the Supabase query builder isn't a real Promise (no
    // .catch() method); calling .catch() on it throws synchronously and,
    // unguarded, was skipping setDone(true) below entirely — the password
    // WAS changed, but the user just saw the form sit there with no success
    // message and no redirect, looking exactly like the reset had failed.
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await (supabase as any).from('audit_logs').insert([{
          actor_id: user.id,
          action: 'auth.password_reset',
          target_table: 'auth.users',
          target_id: user.id,
        }])
      }
    } catch {}

    setDone(true)
    // Redirect based on user role
    const { data: { user: u } } = await supabase.auth.getUser()
    if (u) {
      const { data: p } = await (supabase as any).from('profiles').select('role').eq('id', u.id).single()
      const dest = p?.role === 'owner' ? '/dashboard' : p?.role === 'influencer' ? '/dashboard/influencer' : '/'
      setTimeout(() => router.push(dest), 2500)
    } else {
      setTimeout(() => router.push('/auth/signin'), 2500)
    }
  }

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', fontFamily: '-apple-system,sans-serif', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Password updated</h2>
        <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>Your password has been changed. Redirecting you to your dashboard…</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', fontFamily: '-apple-system,sans-serif', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#1a1a1a', fontSize: 20, fontWeight: 700 }}>
            Food<span style={{ color: C.coral }}>Culture</span>.ai
          </Link>
          <p style={{ fontSize: 14, color: '#888', marginTop: 6 }}>Set your new password</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 28 }}>
          {linkExpired ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
              <p style={{ fontSize: 14, color: C.error, marginBottom: 20 }}>This reset link is invalid or has expired. Please request a new one.</p>
              <Link href="/auth/forgot-password"
                style={{ display: 'inline-block', background: C.coral, color: '#fff', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.error }} role="alert">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="new-password" style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="8+ characters"
                  autoComplete="new-password"
                  style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none' }}
                />
                <PasswordStrength password={password} />
              </div>

              <div>
                <label htmlFor="confirm-password" style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none',
                    borderColor: confirm && password !== confirm ? C.error : C.border }}
                />
                {confirm && password !== confirm && (
                  <p style={{ fontSize: 12, color: C.error, marginTop: 4 }}>Passwords do not match</p>
                )}
              </div>

              <button type="submit" disabled={loading || !hasSession}
                style={{ background: C.coral, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Updating…' : 'Set new password'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#888', marginTop: 20 }}>
          <Link href="/auth/signin" style={{ color: C.coral, textDecoration: 'none' }}>← Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
