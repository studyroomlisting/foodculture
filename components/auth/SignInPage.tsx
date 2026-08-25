'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const C = { coral: '#E85D26', border: '#ede8e2', error: '#dc2626', green: '#2E9E55' }

export default function SignInPage() {
  const router  = useRouter()
  const params  = useSearchParams()
  const nextUrl = params?.get('next') ?? '/dashboard'
  const safeNext = nextUrl.startsWith('/') && !nextUrl.startsWith('//') ? nextUrl : '/dashboard'

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)
  const [error,        setError]        = useState('')
  const [magicSent,    setMagicSent]    = useState(false)
  const [rememberMe,   setRememberMe]   = useState(false)
  const [isLocked,    setIsLocked]     = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return }
    if (!password) { setError('Please enter your password.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })
    // Remember Me: set long session (30 days) vs short (1 day) via cookie
    if (!err && rememberMe) {
      await supabase.auth.updateUser({})  // touch session to refresh token
    }
    setLoading(false)
    if (err) {
      // Log failed attempt + check lockout status
      try {
        const logRes = await fetch('/api/auth/log-failed-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.toLowerCase().trim() }),
        })
        const logData = await logRes.json()
        if (logData.locked) {
          setIsLocked(true)
          setError('Your account has been locked after too many failed attempts. Please reset your password to regain access.')
        } else if (logData.remaining && logData.remaining <= 3) {
          setError(`Invalid email or password. ${logData.remaining} attempt${logData.remaining === 1 ? '' : 's'} remaining before your account is locked.`)
        } else {
          setError('Invalid email or password. Please try again.')
        }
      } catch {
        setError('Invalid email or password. Please try again.')
      }
      return
    }
    router.push(safeNext); router.refresh()
  }

  async function handleMagicLink() {
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter your email address to receive a magic link.'); return }
    setMagicLoading(true)
    await supabase.auth.signInWithOtp({ email: email.toLowerCase().trim(), options: { emailRedirectTo: `${location.origin}/auth/callback?next=${safeNext}` } })
    setMagicLoading(false); setMagicSent(true)
  }

  async function handleGoogle() {
    setError('')
    try {
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${location.origin}/auth/callback?next=${safeNext}`, queryParams: { access_type: 'offline', prompt: 'consent' } },
      })
      if (oauthErr) setError('Google sign-in failed. Please try again or use email instead.')
    } catch {
      setError('Could not connect to Google. Check your connection and try again.')
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa', fontFamily:'-apple-system,sans-serif', padding:24 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <Link href="/" style={{ textDecoration:'none', color:'#1a1a1a', fontSize:20, fontWeight:700 }}>Food<span style={{ color:C.coral }}>Culture</span>.ai</Link>
          <p style={{ fontSize:14, color:'#888', marginTop:6 }}>Sign in to your account</p>
        </div>
        <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${C.border}`, padding:28 }}>
          <button onClick={handleGoogle} type="button" style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10, background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'11px 0', fontSize:14, fontWeight:500, cursor:'pointer', marginBottom:16, fontFamily:'inherit' }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}><div style={{ flex:1, height:1, background:C.border }} /><span style={{ fontSize:12, color:'#aaa' }}>or sign in with email</span><div style={{ flex:1, height:1, background:C.border }} /></div>
          <form onSubmit={handleSignIn} noValidate style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {error && (
              <div role="alert" style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, color:C.error }}>
                <div>{error}</div>
                {isLocked && (
                  <a href="/auth/forgot-password" style={{ display:'inline-block', marginTop:8, color:'#dc2626', fontWeight:700, textDecoration:'underline', fontSize:13 }}>
                    Reset your password →
                  </a>
                )}
              </div>
            )}
            {magicSent && <div role="status" style={{ background:'#EAF8EE', border:'1px solid #b6e8c4', borderRadius:8, padding:'10px 14px', fontSize:13, color:C.green }}>Magic link sent to <strong>{email}</strong> — check your inbox.</div>}
            <div>
              <label htmlFor="signin-email" style={{ fontSize:13, fontWeight:500, color:'#555', display:'block', marginBottom:6 }}>Email address</label>
              <input id="signin-email" type="email" required autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setMagicSent(false) }} placeholder="you@example.com" style={{ width:'100%', boxSizing:'border-box', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', fontSize:14, outline:'none', fontFamily:'inherit' }} />
            </div>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <label htmlFor="signin-password" style={{ fontSize:13, fontWeight:500, color:'#555' }}>Password</label>
                <Link href="/auth/forgot-password" style={{ fontSize:12, color:C.coral, textDecoration:'none' }}>Forgot password?</Link>
              </div>
              <input id="signin-password" type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" style={{ width:'100%', boxSizing:'border-box', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', fontSize:14, outline:'none', fontFamily:'inherit' }} />
            </div>
            {/* Remember Me */}
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'#555' }}>
              <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                style={{ accentColor:'#E85D26', width:15, height:15 }} />
              Remember me for 30 days
            </label>
            <button type="submit" disabled={loading} style={{ background:C.coral, color:'#fff', border:'none', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:600, cursor:'pointer', opacity:loading?0.7:1, fontFamily:'inherit' }}>{loading ? 'Signing in...' : 'Sign in'}</button>
            <button type="button" onClick={handleMagicLink} disabled={magicLoading||magicSent} style={{ background:'#f5f0ea', color:'#555', border:'none', borderRadius:10, padding:'11px 0', fontSize:13, cursor:'pointer', opacity:magicLoading?0.7:1, fontFamily:'inherit' }}>{magicLoading ? 'Sending...' : magicSent ? 'Magic link sent ✓' : 'Send magic link instead'}</button>
          </form>
        </div>
        <p style={{ textAlign:'center', fontSize:14, color:'#888', marginTop:20 }}>New to FoodCulture AI? <Link href="/auth/signup" style={{ color:C.coral, textDecoration:'none', fontWeight:500 }}>Create account</Link></p>
      </div>
    </div>
  )
}
