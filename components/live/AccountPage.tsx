'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { nameError, phoneError, instagramHandleError } from '@/lib/validation'

const C = { coral: '#E85D26', green: '#2E9E55', border: '#ede8e2', amber: '#D4860A' }

const SIDEBAR = [
  { href: '/account', label: 'My profile', active: true },
  { href: '/account/saved', label: 'Saved content' },
  { href: '/account/activity', label: 'Activity history' },
  { href: '/account/notifications', label: 'Notifications' },
  { href: '/account/privacy', label: 'Privacy' },
  { href: '/account/security', label: 'Security' },
]

// Same option lists as the creator onboarding wizard (OnboardingPage.tsx's
// InfluencerOnboarding) — kept in sync so a value saved in one place always
// renders correctly in the other.
const AUDIENCE_OPTIONS = [['micro','<10K'],['mid','10K–100K'],['macro','100K–1M'],['mega','1M+']] as const
const CONTENT_TYPES = ['Restaurant reviews','Food vlogs','Recipe videos','Street food','Fine dining','Food photography','Honest reviews','Travel + Food']
const CUISINES = ['Biryani','South Indian','North Indian','Street Food','Seafood','Mughlai','Cafes','Fine Dining','Desserts','Bakery','Burgers','Pizza','Sushi','Chinese','Thai','Mediterranean','Healthy','Vegan']

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} role="switch" aria-checked={on}
      style={{ width: 44, height: 24, borderRadius: 12, background: on ? C.coral : '#e0e0e0', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
    </button>
  )
}

function Chip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={selected}
      style={{ background: selected ? '#F3EFFE' : '#fff', border: `1px solid ${selected ? '#7F77DD' : C.border}`, borderRadius: 20, padding: '6px 14px', fontSize: 12, color: selected ? '#7F77DD' : '#666', cursor: 'pointer', fontFamily: 'inherit' }}>
      {label}
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
  // Creator-profile fields (only rendered/used for influencers) — separate
  // save state from the personal-info section above since they're saved
  // independently with their own button.
  const [creatorForm, setCreatorForm] = useState({
    bio: '', instagram_handle: '', influencer_youtube: '',
    audience_size_range: '', content_types: [] as string[], preferred_cuisines: [] as string[],
  })
  const [creatorSaving, setCreatorSaving] = useState(false)
  const [creatorSaved, setCreatorSaved]   = useState(false)
  const [creatorError, setCreatorError]   = useState('')
  // Self-service role correction — see the "Not seeing your dashboard?"
  // section below. Needed because a Google-OAuth account signed up before
  // migration_014 was applied is stuck on 'visitor' with no way to fix
  // itself (see that file for the root cause).
  const [roleFixing, setRoleFixing] = useState(false)
  const [roleFixError, setRoleFixError] = useState('')
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
      const { data: p, error: pErr } = await (supabase as any).from('profiles')
        .select('id,full_name,phone,city,role,onboarding_complete,bio,instagram_handle,influencer_youtube,audience_size_range,content_types,preferred_cuisines')
        .eq('id', user.id).single()
      if (pErr || !p) { setLoadError('Could not load your profile. Please refresh.'); setLoading(false); return }
      setProfile(p)
      setForm({ full_name: p.full_name ?? '', phone: p.phone ?? '', city: p.city ?? 'Bengaluru' })
      setCreatorForm({
        bio: p.bio ?? '',
        instagram_handle: p.instagram_handle ?? '',
        influencer_youtube: p.influencer_youtube ?? '',
        audience_size_range: p.audience_size_range ?? '',
        content_types: p.content_types ?? [],
        preferred_cuisines: p.preferred_cuisines ?? [],
      })
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
    setFormError('')
    const nameErr = nameError(form.full_name, 'Full name')
    if (nameErr) { setFormError(nameErr); return }
    const phoneErr = phoneError(form.phone)
    if (phoneErr) { setFormError(phoneErr); return }

    setSaving(true)
    const { error } = await (supabase as any).from('profiles').update({ full_name: form.full_name.trim(), phone: form.phone.trim() || null, city: form.city }).eq('id', user.id)
    setSaving(false)
    if (error) { setFormError('Could not save your changes. Please try again.'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // Self-service role correction (see the "roleFixing" state note above).
  // This UPDATE is only ever allowed by the database when the account's
  // current role is still 'visitor' — protect_profile_role_column() in
  // migration_014 enforces that server-side, so this can't be used to
  // grant a role the account doesn't already qualify to pick.
  async function setInitialRole(role: 'owner' | 'influencer') {
    setRoleFixing(true); setRoleFixError('')
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ role, onboarding_role: role, onboarding_complete: true })
      .eq('id', user.id)
    setRoleFixing(false)
    if (error) {
      setRoleFixError(
        "Couldn't save this — please refresh the page and try again. If it still doesn't work, this account may need a one-time backend update first."
      )
      return
    }
    setProfile((prev: any) => ({ ...prev, role, onboarding_complete: true }))
    if (role === 'owner') router.push('/dashboard/listings/new')
    // For 'influencer' we stay right here — the Creator profile section
    // below appears immediately (isInfluencer flips true) so they can fill
    // it in and submit for review without an extra page hop.
  }

  async function handleSaveCreatorProfile() {
    const handleErr = instagramHandleError(creatorForm.instagram_handle, { required: true })
    if (handleErr) {
      setCreatorError(handleErr)
      return
    }
    setCreatorSaving(true); setCreatorError('')
    try {
      const [profileRes] = await Promise.all([
        fetch('/api/profile', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bio: creatorForm.bio,
            instagram_handle: creatorForm.instagram_handle,
            influencer_youtube: creatorForm.influencer_youtube,
            audience_size_range: creatorForm.audience_size_range || undefined,
            content_types: creatorForm.content_types,
          }),
        }),
        fetch('/api/preferences', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferred_cuisines: creatorForm.preferred_cuisines }),
        }),
      ])
      if (!profileRes.ok) {
        const j = await profileRes.json().catch(() => ({}))
        setCreatorError(j.error || 'Could not save your creator profile. Please try again.')
        setCreatorSaving(false)
        return
      }

      // Mirror onto the public `influencers` row — same upsert shape as
      // InfluencerOnboarding's finish() in OnboardingPage.tsx, so someone
      // who never completed that wizard (or whose role was stuck until
      // just now) gets a real listing the moment they save this section,
      // instead of staying invisible in the directory and admin panel.
      const { data: existing } = await (supabase as any)
        .from('influencers').select('id, slug, listing_status').eq('profile_id', user.id).maybeSingle()
      const fullName = form.full_name.trim() || 'Creator'
      const baseSlug = fullName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50) || 'creator'
      const initials = fullName.split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('') || 'FC'
      const { error: infErr } = await (supabase as any).from('influencers').upsert([{
        profile_id: user.id,
        slug: existing?.slug ?? `${baseSlug}-${Date.now().toString(36)}`,
        name: fullName,
        handle: creatorForm.instagram_handle.trim().replace(/^@/, ''),
        avatar_initials: initials,
        bio: creatorForm.bio || null,
        platform: creatorForm.influencer_youtube.trim() ? 'both' : 'instagram',
        // Re-editing after a rejection resubmits it for review (migration_016
        // — only this one draft/rejected -> pending_review transition is
        // allowed for a non-admin; anything else is silently ignored).
        ...(existing && ['draft', 'rejected'].includes(existing.listing_status)
          ? { listing_status: 'pending_review' } : {}),
        cuisine_tags: creatorForm.preferred_cuisines,
        // listing_status is locked server-side to 'pending_review' on
        // insert (migration_013) — an admin still has to approve.
      }], { onConflict: 'profile_id' })
      if (infErr) {
        setCreatorError('Profile fields saved, but your public creator listing could not be updated. Please try again.')
        setCreatorSaving(false)
        return
      }

      setCreatorSaving(false); setCreatorSaved(true)
      setTimeout(() => setCreatorSaved(false), 2500)
    } catch {
      setCreatorSaving(false)
      setCreatorError('Something went wrong. Please try again.')
    }
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

        {/* Role self-correction — only shown when we genuinely can't tell
            what this account is (not owner/influencer/admin, and no
            evidence of an owned listing or a creator profile either). Lets
            someone whose role got stuck (see migration_014) unblock
            themselves without needing us to touch the database by hand. */}
        {!isOwner && !isInfluencer && !isAdmin && (
          <section style={{ background: '#FEF9F6', border: `1px solid #f5d5c0`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Not seeing your dashboard?</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.6 }}>
              Tell us which one you are, and we'll unlock the right dashboard and profile fields:
            </p>
            {roleFixError && (
              <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#dc2626', marginBottom: 12 }}>
                {roleFixError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => setInitialRole('owner')} disabled={roleFixing}
                style={{ background: '#fff', border: `1px solid ${C.coral}`, borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, color: C.coral, cursor: roleFixing ? 'default' : 'pointer', opacity: roleFixing ? 0.6 : 1 }}>
                🏪 I'm a restaurant owner
              </button>
              <button onClick={() => setInitialRole('influencer')} disabled={roleFixing}
                style={{ background: '#fff', border: `1px solid #7F77DD`, borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, color: '#7F77DD', cursor: roleFixing ? 'default' : 'pointer', opacity: roleFixing ? 0.6 : 1 }}>
                ✨ I'm a food creator
              </button>
            </div>
          </section>
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

          {/* Creator profile — instagram handle, content types, audience
              size, cuisine expertise. These existed as DB columns and were
              collected during the onboarding wizard, but there was no way
              to view or edit them afterwards — this is what restaurants
              actually see on the public influencer directory, via the
              `influencers` row this section keeps in sync on save. */}
          {isInfluencer && (
            <section aria-labelledby="creator-heading" style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
              <h2 id="creator-heading" style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                ✨ Creator profile
              </h2>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>This is what restaurants see when they discover you in the influencer directory.</p>
              {creatorError && (
                <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#dc2626', marginBottom: 16 }}>
                  {creatorError}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label htmlFor="creator-ig" style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 7 }}>Instagram handle <span style={{ color: C.coral }}>*</span></label>
                  <input id="creator-ig" value={creatorForm.instagram_handle} onChange={e => setCreatorForm(f => ({ ...f, instagram_handle: e.target.value }))}
                    placeholder="@rahulkitchens"
                    style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label htmlFor="creator-yt" style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 7 }}>YouTube channel <span style={{ color: '#bbb', fontWeight: 400 }}>(optional)</span></label>
                  <input id="creator-yt" value={creatorForm.influencer_youtube} onChange={e => setCreatorForm(f => ({ ...f, influencer_youtube: e.target.value }))}
                    placeholder="https://youtube.com/@channel"
                    style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="creator-bio" style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 7 }}>Bio</label>
                <textarea id="creator-bio" value={creatorForm.bio} onChange={e => setCreatorForm(f => ({ ...f, bio: e.target.value.slice(0, 500) }))}
                  placeholder="Bengaluru's most honest food reviewer…"
                  style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit', minHeight: 70, resize: 'vertical' }} />
                <div style={{ fontSize: 11, color: '#bbb', textAlign: 'right' }}>{creatorForm.bio.length}/500</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 8 }}>Approximate audience size</label>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {AUDIENCE_OPTIONS.map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setCreatorForm(f => ({ ...f, audience_size_range: val }))} aria-pressed={creatorForm.audience_size_range === val}
                      style={{ background: creatorForm.audience_size_range === val ? '#F3EFFE' : '#fff', border: `1px solid ${creatorForm.audience_size_range === val ? '#7F77DD' : C.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, color: creatorForm.audience_size_range === val ? '#7F77DD' : '#666', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 8 }}>Content types</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {CONTENT_TYPES.map(ct => (
                    <Chip key={ct} label={ct} selected={creatorForm.content_types.includes(ct)}
                      onToggle={() => setCreatorForm(f => ({ ...f, content_types: f.content_types.includes(ct) ? f.content_types.filter(x => x !== ct) : [...f.content_types, ct] }))} />
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 8 }}>Cuisine expertise</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {CUISINES.map(c => (
                    <Chip key={c} label={c} selected={creatorForm.preferred_cuisines.includes(c)}
                      onToggle={() => setCreatorForm(f => ({ ...f, preferred_cuisines: f.preferred_cuisines.includes(c) ? f.preferred_cuisines.filter(x => x !== c) : [...f.preferred_cuisines, c] }))} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={handleSaveCreatorProfile} disabled={creatorSaving}
                  style={{ background: '#7F77DD', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: creatorSaving ? .7 : 1 }}>
                  {creatorSaving ? 'Saving…' : 'Save creator profile'}
                </button>
                {creatorSaved && <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>✓ Saved successfully</span>}
              </div>
            </section>
          )}

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
