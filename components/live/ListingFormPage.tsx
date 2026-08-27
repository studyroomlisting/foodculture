'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase'
import ImageUploader from '@/components/ImageUploader'
import { businessNameError } from '@/lib/validation'

const C = { coral: '#E85D26', green: '#2E9E55', border: '#ede8e2' }

export default function ListingFormPage({ mode, id }: { mode: 'create' | 'edit'; id?: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')
  const [savedRestId, setSavedRestId] = useState<string|null>(id ?? null)
  const [form, setForm] = useState({
    name: '', area_label: '', cuisine_tags: '', price_tier: '₹₹',
    avg_spend: '', open_until: '', peak_hours: '', ai_brief: '', emoji: '🍽️',
  })

  // Restaurant listings are an owner-only concept. Someone who isn't an
  // owner (e.g. an influencer, or a plain visitor) could previously load
  // this form directly by URL — even though nothing in the nav linked here
  // for them — and the underlying INSERT would only fail late, with a raw
  // RLS error. Bounce them to /dashboard, which itself routes each role to
  // where it belongs.
  //
  // Same "role OR already-owns-a-listing" fallback as DashboardLive.tsx: a
  // real owner whose profiles.role is still wrong (e.g. a Google-OAuth
  // account signed up before migration_014 was applied) must still be able
  // to edit their own existing listing, or add another one.
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/auth/signin'); return }
      const { data: profile } = await (supabase as any)
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role === 'owner') return

      if (mode === 'edit' && id) {
        const { data: rest } = await (supabase as any)
          .from('restaurants').select('owner_id').eq('id', id).single()
        if (rest?.owner_id === user.id) return
      } else {
        const { count } = await (supabase as any)
          .from('restaurants').select('id', { count: 'exact', head: true }).eq('owner_id', user.id)
        if ((count ?? 0) > 0) return
      }

      router.replace('/dashboard')
    })
  }, [router, mode, id])

  useEffect(() => {
    if (mode === 'edit' && id) {
      (supabase as any).from('restaurants').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setForm({
          name: data.name ?? '',
          area_label: data.area_label ?? '',
          cuisine_tags: (data.cuisine_tags ?? []).join(', '),
          price_tier: data.price_tier ?? '₹₹',
          avg_spend: String(data.avg_spend ?? ''),
          open_until: data.open_until ?? '',
          peak_hours: data.peak_hours ?? '',
          ai_brief: data.ai_brief ?? '',
          emoji: data.emoji ?? '🍽️',
        })
      })
    }
  }, [mode, id])

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validation
    const nameErr = businessNameError(form.name, 'Restaurant name')
    if (nameErr) {
      setError(nameErr)
      return
    }
    if (!form.area_label.trim()) {
      setError('Area / neighbourhood is required.')
      return
    }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/signin'); return }

    const payload = {
      name: form.name,
      area_label: form.area_label,
      cuisine_tags: form.cuisine_tags.split(',').map(s => s.trim()).filter(Boolean),
      price_tier: form.price_tier,
      avg_spend: parseInt(form.avg_spend) || null,
      open_until: form.open_until,
      peak_hours: form.peak_hours,
      ai_brief: form.ai_brief,
      emoji: form.emoji,
    }

    let err = null
    if (mode === 'create') {
      const slug = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0,50) + '-' + Date.now().toString(36)
      const { error: insErr } = await (supabase as any).from('restaurants').insert([{ ...payload, slug, owner_id: user.id, listing_status: 'draft' }])
      err = insErr
    } else {
      const { error: updErr } = await (supabase as any).from('restaurants').update(payload).eq('id', id).eq('owner_id', user.id)
      err = updErr
    }

    setSaving(false)
    if (err) {
      setError('Failed to save listing. Please try again.')
      return
    }
    setSaved(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  const fields = [
    { key: 'name',        label: 'Restaurant name *',         type: 'text',   ph: 'Dum Biryani House'       },
    { key: 'emoji',       label: 'Emoji icon',                type: 'text',   ph: '🍜'                      },
    { key: 'area_label',  label: 'Area / neighbourhood *',    type: 'text',   ph: 'Koramangala 5th Block'   },
    { key: 'cuisine_tags',label: 'Cuisine types (comma-sep)', type: 'text',   ph: 'North Indian, Biryani'   },
    { key: 'avg_spend',   label: 'Average spend per person ₹',type: 'number', ph: '420'                     },
    { key: 'open_until',  label: 'Open until',                type: 'text',   ph: '11:30 PM'                },
    { key: 'peak_hours',  label: 'Peak hours',                type: 'text',   ph: '7–10 PM'                 },
  ]

  return (
    <div style={{ fontFamily: "-apple-system,sans-serif", background: '#fafafa', minHeight: '100vh', color: '#1a1a1a' }}>
      <Nav />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>
            {mode === 'create' ? '+ Create new listing' : '✏️ Edit listing'}
          </h1>
          <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
            {mode === 'create' ? 'Your listing will be reviewed before going live.' : 'Changes save immediately. Major edits may require re-review.'}
          </p>
        </div>

        {saved && (
          <div style={{ background: '#EAF8EE', border: '1px solid #b8e8c8', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: C.green, fontWeight: 500 }}>
            ✓ {mode === 'create' ? 'Listing created! Pending review.' : 'Changes saved!'} Redirecting…
          </div>
        )}
        {error && (
          <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#dc2626' }}>
            {error}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 28 }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {fields.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.ph}
                  style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none' }} />
              </div>
            ))}

            {/* Price tier */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>Price range</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['₹','₹₹','₹₹₹','₹₹₹₹'].map(p => (
                  <button key={p} type="button" onClick={() => set('price_tier', p)}
                    style={{ flex: 1, background: form.price_tier === p ? '#FEF0EA' : '#fff', border: `1px solid ${form.price_tier === p ? C.coral : C.border}`, borderRadius: 8, padding: '8px 4px', fontSize: 14, color: form.price_tier === p ? C.coral : '#666', cursor: 'pointer', fontWeight: form.price_tier === p ? 600 : 400 }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Image upload — shown when editing or after create */}
            {(mode === 'edit' || savedRestId) && savedRestId && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 8 }}>Photos</label>
                <ImageUploader restaurantId={savedRestId} />
              </div>
            )}

            {/* AI brief */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>AI Intelligence brief (optional)</label>
              <textarea value={form.ai_brief} onChange={e => set('ai_brief', e.target.value)} rows={3}
                placeholder="Brief description of what makes this restaurant special..."
                style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
              <button type="button" onClick={() => router.back()}
                style={{ flex: 1, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 0', fontSize: 14, color: '#666', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" disabled={saving || saved || !form.name || !form.area_label}
                style={{ flex: 2, background: C.coral, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: (saving || !form.name || !form.area_label) ? 0.6 : 1 }}>
                {saving ? 'Saving…' : mode === 'create' ? 'Create listing' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
