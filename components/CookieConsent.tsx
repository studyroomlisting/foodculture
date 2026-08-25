'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const C = { coral: '#E85D26', border: '#ede8e2' }
const COOKIE_KEY = 'fc_consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    // Show banner if consent not yet given
    const stored = localStorage.getItem(COOKIE_KEY)
    if (!stored) setVisible(true)
  }, [])

  function accept() {
    setSaving(true)
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ analytics: true, marketing: false, ts: Date.now() }))
    setVisible(false)
    setSaving(false)
  }

  function decline() {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ analytics: false, marketing: false, ts: Date.now() }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div role="dialog" aria-labelledby="cookie-title" aria-describedby="cookie-desc"
      style={{ position: 'fixed', bottom: 24, left: 24, right: 24, maxWidth: 520, margin: '0 auto', background: '#1a1a1a', borderRadius: 16, padding: '20px 24px', zIndex: 999, boxShadow: '0 8px 40px rgba(0,0,0,.25)', display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 240 }}>
        <div id="cookie-title" style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
          🍪 Cookie preferences
        </div>
        <p id="cookie-desc" style={{ fontSize: 13, color: '#aaa', lineHeight: 1.5, margin: 0 }}>
          We use cookies to improve your experience. See our{' '}
          <Link href="/privacy" style={{ color: C.coral, textDecoration: 'none' }}>Privacy Policy</Link>.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={decline}
          style={{ background: 'transparent', border: '1px solid #444', borderRadius: 20, padding: '8px 16px', fontSize: 13, color: '#888', cursor: 'pointer' }}>
          Decline
        </button>
        <button onClick={accept} disabled={saving}
          style={{ background: C.coral, border: 'none', borderRadius: 20, padding: '8px 20px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
          Accept all
        </button>
      </div>
    </div>
  )
}
