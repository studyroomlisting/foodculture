'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const C = { coral: '#E85D26', border: '#ede8e2', error: '#dc2626', green: '#2E9E55' }
const COMMON_PASSWORDS = ['password','12345678','password1','qwerty123','letmein1','football1','iloveyou','admin123','welcome1','monkey123']

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const checks = [
    { label: 'At least 8 characters',    ok: password.length >= 8 },
    { label: 'Uppercase letter (A-Z)',    ok: /[A-Z]/.test(password) },
    { label: 'Number (0-9)',              ok: /[0-9]/.test(password) },
    { label: 'Special character',         ok: /[^A-Za-z0-9]/.test(password) },
  ]
  const score    = checks.filter(c => c.ok).length
  const barColor = score <= 1 ? '#dc2626' : score === 2 ? '#D4860A' : score === 3 ? '#F5A623' : C.green
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= score ? barColor : '#e0e0e0', transition: 'background .2s' }} />
        ))}
        <span style={{ fontSize: 11, color: barColor, fontWeight: 700, marginLeft: 4 }}>
          {['','Weak','Fair','Good','Strong'][score]}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {checks.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: c.ok ? C.green : '#bbb' }}>
            <span aria-hidden="true">{c.ok ? '✓' : '○'}</span>{c.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SignUpPage() {
  const router  = useRouter()
  const params  = useSearchParams()
  const nextUrl = params?.get('next') ?? '/onboarding'
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [role,      setRole]      = useState<'visitor'|'owner'|'influencer'>('visitor')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)
  const [resending, setResending] = useState(false)
  const [resent,    setResent]    = useState(false)
  const [termsAccepted,   setTermsAccepted]   = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  function validate(): string | null {
    if (!name.trim() || name.trim().length < 2) return 'Please enter your full name (at least 2 characters).'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.'
    if (password.length < 8) return 'Password must be at least 8 characters.'
    if (COMMON_PASSWORDS.includes(password.toLowerCase())) return 'This password is too common. Please choose a stronger one.'
    if (password !== confirm) return 'Passwords do not match.'
    if (!termsAccepted) return 'You must accept the Terms of Service to continue.'
    if (!privacyAccepted) return 'You must accept the Privacy Policy to continue.'
    return null
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true); setError('')
    const { error: supaErr } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: { full_name: name.trim(), role, terms_accepted_at: new Date().toISOString(), privacy_accepted_at: new Date().toISOString() },
        emailRedirectTo: `${location.origin}/auth/callback?next=${role === 'owner' || role === 'influencer' ? '/onboarding' : nextUrl}`,
      },
    })
    setLoading(false)
    if (supaErr) { setError(supaErr.message); return }
    setDone(true)
  }

  async function handleGoogle() {
    setError('')
    // Pass selected role in the redirect URL so callback can update profile
    const dest = (role === 'owner' || role === 'influencer') ? '/onboarding' : nextUrl
    try {
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback?next=${dest}&role=${role}`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (oauthErr) setError('Google sign-up failed. Please try again or use email instead.')
    } catch {
      setError('Could not connect to Google. Check your connection and try again.')
    }
  }

  async function handleResend() {
    setResending(true)
    await supabase.auth.resend({ type: 'signup', email })
    setResending(false); setResent(true)
    setTimeout(() => setResent(false), 5000)
  }

  if (done) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa', fontFamily:'-apple-system,sans-serif', padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:380 }}>
        <div style={{ fontSize:52, marginBottom:16 }}>📬</div>
        <h1 style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>Check your email</h1>
        <p style={{ fontSize:14, color:'#666', lineHeight:1.7, marginBottom:24 }}>
          We sent a verification link to <strong>{email}</strong>. Click it to activate your account and get started.
        </p>
        {resent && (
          <div role="status" style={{ background:'#EAF8EE', border:'1px solid #b6e8c4', borderRadius:10, padding:'10px 16px', fontSize:13, color:C.green, marginBottom:12 }}>
            Verification email resent successfully!
          </div>
        )}
        <button onClick={handleResend} disabled={resending}
          style={{ display:'block', width:'100%', background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'11px 0', fontSize:13, color:'#555', cursor:'pointer', marginBottom:10, fontFamily:'inherit', opacity:resending?0.7:1 }}>
          {resending ? 'Sending...' : 'Resend verification email'}
        </button>
        <Link href="/auth/signin" style={{ fontSize:14, color:C.coral, textDecoration:'none' }}>Back to sign in</Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa', fontFamily:'-apple-system,sans-serif', padding:24 }}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <Link href="/" style={{ textDecoration:'none', color:'#1a1a1a', fontSize:20, fontWeight:700 }}>
            Food<span style={{ color:C.coral }}>Culture</span>.ai
          </Link>
          <p style={{ fontSize:14, color:'#888', marginTop:6 }}>Create your free account</p>
        </div>

        <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${C.border}`, padding:28 }}>
          {/* Role picker */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:20 }}>
            {([
              ['visitor',    '🍽️', 'Food explorer',    'Browse restaurants'],
              ['owner',      '🏪', 'Restaurant owner', 'List your restaurant'],
              ['influencer', '✨', 'Food creator',     'Grow with brands'],
            ] as const).map(([v, icon, label, sub]) => (
              <button key={v} onClick={() => setRole(v)} type="button" aria-pressed={role===v}
                style={{ background:role===v?(v==='influencer'?'#F3EFFE':'#FEF0EA'):'#fafafa', border:`2px solid ${role===v?(v==='influencer'?'#7F77DD':C.coral):C.border}`, borderRadius:10, padding:'12px 10px', cursor:'pointer', textAlign:'left' }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color:role===v?(v==='influencer'?'#7F77DD':C.coral):'#1a1a1a' }}>{label}</div>
                <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{sub}</div>
              </button>
            ))}
          </div>

          {/* Google OAuth */}
          <button onClick={handleGoogle} type="button"
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10, background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'11px 0', fontSize:14, fontWeight:500, cursor:'pointer', marginBottom:16 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{ flex:1, height:1, background:C.border }} /><span style={{ fontSize:12, color:'#aaa' }}>or sign up with email</span><div style={{ flex:1, height:1, background:C.border }} />
          </div>

          <form onSubmit={handleSignUp} noValidate style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {error && <div role="alert" style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, color:C.error }}>{error}</div>}

            {[
              { id:'signup-name', type:'text', label:'Full name', value:name, set:setName, placeholder:'Priya Sharma', autoComplete:'name' },
              { id:'signup-email', type:'email', label:'Email address', value:email, set:setEmail, placeholder:'you@example.com', autoComplete:'email' },
            ].map(f => (
              <div key={f.id}>
                <label htmlFor={f.id} style={{ fontSize:13, fontWeight:500, color:'#555', display:'block', marginBottom:6 }}>{f.label}</label>
                <input id={f.id} type={f.type} required autoComplete={f.autoComplete} value={f.value}
                  onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                  style={{ width:'100%', boxSizing:'border-box', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', fontSize:14, outline:'none', fontFamily:'inherit' }} />
              </div>
            ))}

            <div>
              <label htmlFor="signup-password" style={{ fontSize:13, fontWeight:500, color:'#555', display:'block', marginBottom:6 }}>Password</label>
              <input id="signup-password" type="password" required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="8+ characters"
                style={{ width:'100%', boxSizing:'border-box', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', fontSize:14, outline:'none', fontFamily:'inherit' }} />
              <PasswordStrength password={password} />
            </div>

            <div>
              <label htmlFor="signup-confirm" style={{ fontSize:13, fontWeight:500, color:'#555', display:'block', marginBottom:6 }}>Confirm password</label>
              <input id="signup-confirm" type="password" required autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter your password"
                style={{ width:'100%', boxSizing:'border-box', border:`1px solid ${confirm&&password!==confirm?C.error:C.border}`, borderRadius:10, padding:'10px 14px', fontSize:14, outline:'none', fontFamily:'inherit' }}
                aria-describedby={confirm&&password!==confirm?'pw-mismatch':undefined} />
              {confirm && password !== confirm && <p id="pw-mismatch" role="alert" style={{ fontSize:12, color:C.error, marginTop:4 }}>Passwords do not match</p>}
            </div>

            {/* T&C + Privacy mandatory checkboxes — BEFORE submit */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', fontSize:12, color:'#555', lineHeight:1.5 }}>
                <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                  style={{ marginTop:2, flexShrink:0, accentColor:C.coral, width:15, height:15 }} />
                <span>I agree to the <Link href="/terms" style={{ color:C.coral, textDecoration:'none' }}>Terms of Service</Link> <span style={{color:C.error}}>*</span></span>
              </label>
              <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', fontSize:12, color:'#555', lineHeight:1.5 }}>
                <input type="checkbox" checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)}
                  style={{ marginTop:2, flexShrink:0, accentColor:C.coral, width:15, height:15 }} />
                <span>I accept the <Link href="/privacy" style={{ color:C.coral, textDecoration:'none' }}>Privacy Policy</Link> <span style={{color:C.error}}>*</span></span>
              </label>
            </div>

            <button type="submit" disabled={loading || !termsAccepted || !privacyAccepted}
              style={{ background:C.coral, color:'#fff', border:'none', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:600, cursor: (!termsAccepted||!privacyAccepted||loading)?'not-allowed':'pointer', opacity:(loading||!termsAccepted||!privacyAccepted)?0.6:1, fontFamily:'inherit' }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', fontSize:14, color:'#888', marginTop:20 }}>
          Already have an account?{' '}
          <Link href="/auth/signin" style={{ color:C.coral, textDecoration:'none', fontWeight:500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
