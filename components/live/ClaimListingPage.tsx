'use client'
import { useEffect, useState } from 'react'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase'

const C = { coral: '#E85D26', green: '#2E9E55', border: '#ede8e2' }

export default function ClaimListingPage({ slug }: { slug: string }) {
  const [restaurant, setRestaurant] = useState<any>(null)
  const [form, setForm] = useState({ evidence_notes: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (supabase as any).from('restaurants').select('id,name,emoji,area_label').eq('slug', slug).single()
      .then(({ data }) => { setRestaurant(data); setLoading(false) })
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = `/auth/signin?next=/restaurants/${slug}/claim`; return }
    await (supabase as any).from('listing_claims').insert([{
      restaurant_id: restaurant.id,
      claimant_id: user.id,
      evidence_notes: form.evidence_notes,
    }])
    setSubmitted(true)
  }

  if (loading) return <><Nav /><div style={{ textAlign: 'center', padding: 80, color: '#aaa' }}>Loading…</div></>

  return (
    <div style={{ fontFamily: "-apple-system,sans-serif", background: '#fafafa', minHeight: '100vh', color: '#1a1a1a' }}>
      <Nav />
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '48px 24px' }}>
        {submitted ? (
          <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Claim submitted!</h2>
            <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>
              Our team will verify your ownership of <strong>{restaurant?.name}</strong> within 2–3 business days.
            </p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <span style={{ fontSize: 42 }}>{restaurant?.emoji ?? '🍽️'}</span>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: '12px 0 6px' }}>Claim {restaurant?.name}</h1>
              <p style={{ fontSize: 14, color: '#888' }}>Verify you're the owner to manage this listing</p>
            </div>
            <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 28 }}>
              <div style={{ background: '#FEF9F6', border: '1px solid #f5d5c0', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: C.coral }}>What you'll get as a verified owner</h3>
                {['Edit your restaurant details','Respond to reviews','Create and manage deals','Connect with influencers','Access revenue dashboard'].map(item => (
                  <div key={item} style={{ fontSize: 13, color: '#555', padding: '4px 0', display: 'flex', gap: 8 }}>
                    <span style={{ color: C.green }}>✓</span>{item}
                  </div>
                ))}
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
                    How can you prove ownership? *
                  </label>
                  <textarea
                    required
                    value={form.evidence_notes}
                    onChange={e => setForm({ evidence_notes: e.target.value })}
                    placeholder="e.g. I am the registered owner. My GST number is 29XXXXX. You can call me at +91 98xxx xxxxx to verify."
                    rows={4}
                    style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', resize: 'vertical' }}
                  />
                </div>
                <button type="submit"
                  style={{ background: C.coral, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Submit claim
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
