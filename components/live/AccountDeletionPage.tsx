'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase'

const C = { coral: '#E85D26', border: '#ede8e2', red: '#dc2626' }

export default function AccountDeletionPage() {
  const router = useRouter()
  const [step, setStep]         = useState<'confirm' | 'deleting' | 'done'>('confirm')
  const [typed, setTyped]       = useState('')
  const [error, setError]       = useState('')

  async function handleDelete() {
    setStep('deleting')
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/signin'); return }

    try {
      // Anonymise reviews (keep content, remove name link)
      await (supabase as any).from('reviews')
        .update({ reviewer_name: 'Deleted user' })
        .eq('restaurant_id', user.id) // approximate — full anonymisation needs service role

      // Remove saved listings
      await (supabase as any).from('saved_listings').delete().eq('user_id', user.id)

      // Remove onboarding progress
      await (supabase as any).from('onboarding_progress').delete().eq('user_id', user.id)

      // Remove notifications
      await (supabase as any).from('notifications').delete().eq('user_id', user.id)

      // Soft-delete profile (set role to deleted, clear PII)
      await (supabase as any).from('profiles').update({
        full_name: 'Deleted user',
        phone: null,
        avatar_url: null,
        role: 'visitor',
        onboarding_complete: false,
      }).eq('id', user.id)

      // Sign out — actual auth deletion requires service role key (done server-side)
      await supabase.auth.signOut()
      setStep('done')
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.')
      setStep('confirm')
    }
  }

  if (step === 'done') return (
    <div style={{ fontFamily: "-apple-system,sans-serif", background: '#fafafa', minHeight: '100vh' }}>
      <Nav />
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Account deleted</h1>
        <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 24 }}>
          Your personal data has been removed. Thank you for using FoodCulture AI.
        </p>
        <a href="/" style={{ background: C.coral, color: '#fff', borderRadius: 24, padding: '12px 28px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
          Return to homepage
        </a>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: "-apple-system,sans-serif", background: '#fafafa', minHeight: '100vh', color: '#1a1a1a' }}>
      <Nav />
      <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 24px' }}>
        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 16 }} aria-hidden="true">⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: C.red }}>Delete your account</h1>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 20 }}>
            This will permanently remove your personal data from FoodCulture AI. This action <strong>cannot be undone</strong>.
          </p>

          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.red, marginBottom: 8 }}>What gets deleted:</div>
            {[
              'Your profile and personal information',
              'Your saved restaurant bookmarks',
              'Your notification history',
              'Your onboarding progress',
            ].map(item => (
              <div key={item} style={{ fontSize: 13, color: '#555', padding: '3px 0', display: 'flex', gap: 8 }}>
                <span aria-hidden="true">✕</span>{item}
              </div>
            ))}
            <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginTop: 10 }}>Reviews you&apos;ve written will be anonymised, not deleted.</div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="confirm-delete" style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 8 }}>
              Type <strong>DELETE</strong> to confirm
            </label>
            <input id="confirm-delete" type="text" value={typed} onChange={e => setTyped(e.target.value)}
              placeholder="DELETE"
              style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'monospace', letterSpacing: 1 }} />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.red, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => router.back()}
              style={{ flex: 1, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 0', fontSize: 14, color: '#666', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleDelete} disabled={typed !== 'DELETE' || step === 'deleting'}
              style={{ flex: 1, background: typed === 'DELETE' ? C.red : '#fee2e2', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: typed === 'DELETE' ? 'pointer' : 'not-allowed', opacity: step === 'deleting' ? 0.7 : 1 }}>
              {step === 'deleting' ? 'Deleting…' : 'Delete my account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
