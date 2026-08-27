'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { emailError } from '@/lib/validation'

const C = { coral: '#E85D26', border: '#ede8e2', error: '#dc2626', green: '#2E9E55' }

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const emailErr = emailError(email)
    if (emailErr) {
      setError(emailErr)
      return
    }
    setLoading(true)
    // C-1 FIX: redirect to /auth/reset-password not /dashboard
    await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: `${location.origin}/auth/reset-password`,
    })
    setLoading(false)
    setSent(true)
  }

  if (sent) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa', fontFamily:'-apple-system,sans-serif', padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:380 }}>
        <div style={{ fontSize:52, marginBottom:16 }}>📨</div>
        <h1 style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>Check your inbox</h1>
        <p style={{ fontSize:14, color:'#666', lineHeight:1.7, marginBottom:24 }}>
          If an account exists for <strong>{email}</strong>, we sent a password reset link. Check your spam folder if you do not see it.
        </p>
        <p style={{ fontSize:13, color:'#aaa', marginBottom:20 }}>The link expires in 1 hour.</p>
        <Link href="/auth/signin" style={{ display:'inline-block', background:'#E85D26', color:'#fff', borderRadius:10, padding:'10px 24px', fontSize:14, fontWeight:600, textDecoration:'none' }}>
          Back to sign in
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa', fontFamily:'-apple-system,sans-serif', padding:24 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <Link href="/" style={{ textDecoration:'none', color:'#1a1a1a', fontSize:20, fontWeight:700 }}>
            Food<span style={{ color:C.coral }}>Culture</span>.ai
          </Link>
          <p style={{ fontSize:14, color:'#888', marginTop:6 }}>Reset your password</p>
        </div>
        <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${C.border}`, padding:28 }}>
          <p style={{ fontSize:13, color:'#666', marginBottom:20, lineHeight:1.6 }}>
            Enter your email address and we will send you a link to set a new password.
          </p>
          <form onSubmit={handleReset} noValidate style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {error && <div role="alert" style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, color:C.error }}>{error}</div>}
            <div>
              <label htmlFor="reset-email" style={{ fontSize:13, fontWeight:500, color:'#555', display:'block', marginBottom:6 }}>Email address</label>
              <input id="reset-email" type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                style={{ width:'100%', boxSizing:'border-box', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', fontSize:14, outline:'none', fontFamily:'inherit' }} />
            </div>
            <button type="submit" disabled={loading}
              style={{ background:C.coral, color:'#fff', border:'none', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:600, cursor:'pointer', opacity:loading?0.7:1, fontFamily:'inherit' }}>
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        </div>
        <p style={{ textAlign:'center', fontSize:14, color:'#888', marginTop:20 }}>
          <Link href="/auth/signin" style={{ color:C.coral, textDecoration:'none' }}>Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
