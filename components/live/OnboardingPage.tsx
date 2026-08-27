'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { nameError, phoneError, instagramHandleError, businessNameError } from '@/lib/validation'

const C = { coral: '#E85D26', green: '#2E9E55', border: '#ede8e2', amber: '#D4860A', purple: '#7F77DD' }

const CUISINES     = ['Biryani','South Indian','North Indian','Street Food','Seafood','Mughlai','Cafes','Fine Dining','Desserts','Bakery','Burgers','Pizza','Sushi','Chinese','Thai','Mediterranean','Healthy','Vegan']
const DIETARY      = ['Vegetarian','Vegan','Jain','Halal','Gluten-free','Dairy-free','Nut-free','Low-carb','Keto']
const ZONES        = [{id:'koramangala',label:'Koramangala'},{id:'indiranagar',label:'Indiranagar'},{id:'hsr-layout',label:'HSR Layout'},{id:'whitefield',label:'Whitefield'},{id:'jayanagar',label:'Jayanagar'},{id:'jp-nagar',label:'JP Nagar'},{id:'mg-road',label:'MG Road'},{id:'marathahalli',label:'Marathahalli'}]
const CONTENT_TYPES= ['Restaurant reviews','Food vlogs','Recipe videos','Street food','Fine dining','Food photography','Honest reviews','Travel + Food']
const LANGUAGES    = [{val:'en',label:'English'},{val:'hi',label:'Hindi'},{val:'kn',label:'Kannada'},{val:'ta',label:'Tamil'},{val:'te',label:'Telugu'},{val:'ml',label:'Malayalam'}]

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#888', marginBottom:6 }}>
        <span>Step {current} of {total}</span><span style={{ color: pct === 100 ? C.green : '#888' }}>{pct}% complete</span>
      </div>
      <div style={{ height:4, background:'#e5e7eb', borderRadius:4 }}>
        <div style={{ height:'100%', width:`${pct}%`, background: pct === 100 ? C.green : C.coral, borderRadius:4, transition:'width .4s' }} />
      </div>
    </div>
  )
}

function StepDots({ steps, current, labels }: { steps: number; current: number; labels: string[] }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', marginBottom:32 }}>
      {Array.from({ length:steps }, (_,i) => {
        const n=i+1, done=current>n, active=current===n
        return (
          <div key={n} style={{ display:'flex', alignItems:'center', flex:i<steps-1?1:'initial' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:done?C.green:active?C.coral:'#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:done||active?'#fff':'#aaa', flexShrink:0 }}>{done?'✓':n}</div>
              <span style={{ fontSize:9, color:active?C.coral:done?C.green:'#bbb', fontWeight:active?700:400, whiteSpace:'nowrap', maxWidth:54, textAlign:'center' }}>{labels[i]}</span>
            </div>
            {i<steps-1 && <div style={{ flex:1, height:2, background:current>n?C.green:'#e5e7eb', margin:'0 3px', marginBottom:18 }} />}
          </div>
        )
      })}
    </div>
  )
}

function Chip({ label, selected, onToggle }: { label:string; selected:boolean; onToggle:()=>void }) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={selected}
      style={{ background:selected?'#FEF0EA':'#fafafa', border:`1.5px solid ${selected?C.coral:C.border}`, borderRadius:20, padding:'6px 13px', fontSize:13, fontWeight:selected?600:400, color:selected?C.coral:'#555', cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}>
      {selected?'✓ ':''}{label}
    </button>
  )
}

function Toggle({ on, onToggle, id }: { on:boolean; onToggle:()=>void; id:string }) {
  return (
    <button type="button" id={id} role="switch" aria-checked={on} onClick={onToggle}
      style={{ width:44, height:24, borderRadius:12, background:on?C.coral:'#e0e0e0', border:'none', cursor:'pointer', position:'relative', flexShrink:0, transition:'background .2s' }}>
      <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:on?23:3, transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.2)' }} />
    </button>
  )
}

function Field({ id, label, type='text', value, onChange, placeholder='', maxLength, required, optional }: {
  id:string; label:string; type?:string; value:string; onChange:(v:string)=>void;
  placeholder?:string; maxLength?:number; required?:boolean; optional?:boolean
}) {
  return (
    <div>
      <label htmlFor={id} style={{ fontSize:13, fontWeight:500, color:'#555', display:'block', marginBottom:6 }}>
        {label}{optional && <span style={{ color:'#bbb', fontWeight:400 }}> (optional)</span>}
        {required && <span style={{ color:C.coral }}> *</span>}
      </label>
      <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength}
        style={{ width:'100%', boxSizing:'border-box', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', fontSize:14, outline:'none', fontFamily:'inherit' }} />
      {maxLength && value.length > maxLength * 0.85 && (
        <div style={{ fontSize:11, color:'#aaa', textAlign:'right', marginTop:3 }}>{value.length}/{maxLength}</div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VISITOR FLOW — 5 steps
// ═══════════════════════════════════════════════════════════════
function VisitorOnboarding({ userId, name: initName, email: initEmail }: { userId:string; name:string; email:string }) {
  const router = useRouter()
  const [step, setStep]           = useState(1)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  // Profile fields
  const [fullName, setFullName]   = useState(initName)
  const [username, setUsername]   = useState('')
  const [bio, setBio]             = useState('')
  const [dob, setDob]             = useState('')
  const [gender, setGender]       = useState('')
  const [city, setCity]           = useState('Bengaluru')
  const [state, setState]         = useState('Karnataka')
  const [country, setCountry]     = useState('India')
  const [language, setLanguage]   = useState('en')
  // Preferences
  const [cuisines, setCuisines]   = useState<string[]>([])
  const [dietary, setDietary]     = useState<string[]>([])
  const [zones, setZones]         = useState<string[]>([])
  const [radius, setRadius]       = useState(10)
  // Notifications
  const [notifs, setNotifs]       = useState({ email_notifications:true, push_notifications:true, influencer_posts:true, deals_expiry:true, weekly_digest:true, trending_food_alerts:true, restaurant_updates:true, marketing:false })
  const LABELS = ['Welcome','Profile','Preferences','Location','Notifications']
  const TOTAL  = 5

  async function saveProgress(extra: Record<string,unknown> = {}) {
    await (supabase as any).from('onboarding_progress').upsert([{ user_id:userId, flow_type:'visitor', current_step:step, ...extra }]).catch(()=>{})
  }

  async function saveProfile() {
    const fullNameErr = nameError(fullName, 'Full name')
    if (fullNameErr) { setError(fullNameErr); return }
    if (username && (username.length < 3 || !/^[a-z0-9_]+$/.test(username))) {
      setError('Username must be 3+ characters and contain only letters, numbers, and underscores.'); return
    }
    setSaving(true); setError('')
    const res = await fetch('/api/profile', {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ full_name:fullName.trim(), username:username||undefined, bio:bio||undefined, date_of_birth:dob||undefined, gender:gender||undefined, city, state, country, preferred_language:language }),
    })
    setSaving(false)
    if (!res.ok) { const j=await res.json(); setError(j.error||'Failed to save profile.'); return }
    saveProgress({ step_profile_complete:true })
    setStep(3)
  }

  async function savePreferences() {
    await fetch('/api/preferences', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ preferred_cuisines:cuisines, dietary_preferences:dietary }),
    }).catch(()=>{})
    saveProgress({ step_cuisines_selected:true })
    setStep(4)
  }

  async function saveLocation() {
    await fetch('/api/preferences', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ preferred_zone_ids:zones, preferred_search_radius:radius }),
    }).catch(()=>{})
    saveProgress({ step_location_selected:true })
    setStep(5)
  }

  async function finish() {
    setSaving(true); setError('')
    const [prefRes] = await Promise.all([
      fetch('/api/preferences', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ notification_prefs:notifs }) }),
      (supabase as any).from('profiles').update({ onboarding_complete:true, onboarding_role:'visitor' }).eq('id', userId),
    ])
    await (supabase as any).from('onboarding_progress').upsert([{ user_id:userId, flow_type:'visitor', step_notifs_configured:true, completed_at:new Date().toISOString() }])
    setSaving(false)
    setStep(6) // completion screen
  }

  async function skip() {
    await (supabase as any).from('profiles').update({ onboarding_complete:true, onboarding_role:'visitor' }).eq('id', userId).catch(()=>{})
    router.push('/')
  }

  const inputStyle = { width:'100%', boxSizing:'border-box' as const, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', fontSize:14, outline:'none', fontFamily:'inherit' }
  const btnPrimary = (disabled=false) => ({ background:C.coral, color:'#fff', border:'none', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:600 as const, cursor:'pointer', opacity:disabled?0.6:1, fontFamily:'inherit', width:'100%' })
  const btnSecondary = () => ({ flex:1 as const, background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'11px 0', fontSize:13, color:'#666', cursor:'pointer', fontFamily:'inherit' })

  if (step === 6) return (
    <div style={{ minHeight:'100vh', background:'#fafafa', fontFamily:'-apple-system,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:440 }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
        <h1 style={{ fontSize:24, fontWeight:700, marginBottom:8 }}>You're all set!</h1>
        <p style={{ fontSize:14, color:'#666', lineHeight:1.7, marginBottom:28 }}>Your profile is complete. Start exploring Bengaluru's best food and trending restaurants.</p>
        <button onClick={() => router.push('/')} style={{ background:C.coral, color:'#fff', border:'none', borderRadius:12, padding:'13px 32px', fontSize:15, fontWeight:600, cursor:'pointer', marginBottom:12, fontFamily:'inherit' }}>Start exploring →</button>
        <br />
        <Link href="/account" style={{ fontSize:13, color:'#aaa', textDecoration:'none' }}>Edit your profile anytime in Account settings</Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#fafafa', fontFamily:'-apple-system,sans-serif' }}>
      <nav style={{ background:'#fff', borderBottom:`1px solid ${C.border}`, padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Link href="/" style={{ fontWeight:700, fontSize:16, textDecoration:'none', color:'#1a1a1a' }}>Food<span style={{ color:C.coral }}>Culture</span>.ai</Link>
        <button onClick={skip} style={{ background:'none', border:'none', fontSize:13, color:'#aaa', cursor:'pointer', fontFamily:'inherit' }}>Skip for now</button>
      </nav>
      <div style={{ maxWidth:520, margin:'0 auto', padding:'40px 24px' }}>
        {step > 1 && <ProgressBar current={step-1} total={TOTAL-1} />}
        {step > 1 && <StepDots steps={TOTAL-1} current={step-1} labels={LABELS.slice(1)} />}
        <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${C.border}`, padding:28 }}>
          {error && <div role="alert" style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#dc2626', marginBottom:16 }}>{error}</div>}

          {/* STEP 1 — Welcome */}
          {step===1 && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:52, marginBottom:16 }}>👋</div>
              <h1 style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Welcome to FoodCulture AI</h1>
              <p style={{ fontSize:14, color:'#666', lineHeight:1.7, marginBottom:24 }}>Discover what's trending, find new restaurants, and follow Bengaluru's top food creators. Let's set up your profile in a few quick steps.</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:28 }}>
                {[['🔥','Trending food'],['⭐','Real reviews'],['✨','Creator picks']].map(([icon,label]) => (
                  <div key={label as string} style={{ background:'#FEF9F6', border:'1px solid #f5e0d0', borderRadius:12, padding:14, textAlign:'center' }}>
                    <div style={{ fontSize:24, marginBottom:6 }}>{icon}</div>
                    <div style={{ fontSize:11, fontWeight:600, color:'#555' }}>{label}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => { saveProgress(); setStep(2) }} style={btnPrimary()}>Get started →</button>
              <button onClick={skip} style={{ width:'100%', background:'none', border:'none', color:'#aaa', fontSize:13, cursor:'pointer', marginTop:12, fontFamily:'inherit' }}>Skip and explore now</button>
            </div>
          )}

          {/* STEP 2 — Profile */}
          {step===2 && (
            <div>
              <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Your profile</h2>
              <p style={{ fontSize:13, color:'#888', marginBottom:22 }}>Help the community get to know you.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <Field id="ob-name" label="Full name" value={fullName} onChange={setFullName} placeholder="Priya Sharma" maxLength={100} required />
                <Field id="ob-username" label="Username" value={username} onChange={v => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g,''))} placeholder="priya_eats" maxLength={30} optional />
                <div>
                  <label htmlFor="ob-bio" style={{ fontSize:13, fontWeight:500, color:'#555', display:'block', marginBottom:6 }}>Bio <span style={{ color:'#bbb', fontWeight:400 }}>(optional)</span></label>
                  <textarea id="ob-bio" value={bio} onChange={e => setBio(e.target.value)} placeholder="Food lover based in Bengaluru…" maxLength={500}
                    style={{ ...inputStyle, minHeight:70, resize:'vertical' }} />
                  <div style={{ fontSize:11, color:'#bbb', textAlign:'right' }}>{bio.length}/500</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label htmlFor="ob-dob" style={{ fontSize:13, fontWeight:500, color:'#555', display:'block', marginBottom:6 }}>Date of birth <span style={{ color:'#bbb', fontWeight:400 }}>(optional)</span></label>
                    <input id="ob-dob" type="date" value={dob} onChange={e => setDob(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label htmlFor="ob-gender" style={{ fontSize:13, fontWeight:500, color:'#555', display:'block', marginBottom:6 }}>Gender <span style={{ color:'#bbb', fontWeight:400 }}>(optional)</span></label>
                    <select id="ob-gender" value={gender} onChange={e => setGender(e.target.value)} style={{ ...inputStyle, background:'#fff', cursor:'pointer' }}>
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non_binary">Non-binary</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <Field id="ob-city" label="City" value={city} onChange={setCity} placeholder="Bengaluru" maxLength={100} />
                  <Field id="ob-state" label="State" value={state} onChange={setState} placeholder="Karnataka" maxLength={100} />
                </div>
                <Field id="ob-country" label="Country" value={country} onChange={setCountry} placeholder="India" maxLength={100} />
                <div>
                  <label htmlFor="ob-lang" style={{ fontSize:13, fontWeight:500, color:'#555', display:'block', marginBottom:6 }}>Preferred language</label>
                  <select id="ob-lang" value={language} onChange={e => setLanguage(e.target.value)} style={{ ...inputStyle, background:'#fff', cursor:'pointer' }}>
                    {LANGUAGES.map(l => <option key={l.val} value={l.val}>{l.label}</option>)}
                  </select>
                </div>
                <button onClick={saveProfile} disabled={saving||!fullName.trim()} style={btnPrimary(!fullName.trim()||saving)}>
                  {saving?'Saving...':'Continue →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Preferences */}
          {step===3 && (
            <div>
              <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Food preferences</h2>
              <p style={{ fontSize:13, color:'#888', marginBottom:18 }}>Select all that apply — we'll personalise your feed.</p>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:10 }}>Favourite cuisines</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>{CUISINES.map(c => <Chip key={c} label={c} selected={cuisines.includes(c)} onToggle={() => setCuisines(prev => prev.includes(c)?prev.filter(x=>x!==c):[...prev,c])} />)}</div>
              </div>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:10 }}>Dietary preferences</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>{DIETARY.map(d => <Chip key={d} label={d} selected={dietary.includes(d)} onToggle={() => setDietary(prev => prev.includes(d)?prev.filter(x=>x!==d):[...prev,d])} />)}</div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setStep(2)} style={btnSecondary()}>← Back</button>
                <button onClick={savePreferences} style={{ flex:2, background:C.coral, color:'#fff', border:'none', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  {cuisines.length>0 ? `Continue with ${cuisines.length} selected →` : 'Skip this step →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 — Location */}
          {step===4 && (
            <div>
              <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Your areas in Bengaluru</h2>
              <p style={{ fontSize:13, color:'#888', marginBottom:18 }}>Select neighbourhoods you eat out in most.</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:20 }}>
                {ZONES.map(z => <Chip key={z.id} label={z.label} selected={zones.includes(z.id)} onToggle={() => setZones(prev => prev.includes(z.id)?prev.filter(x=>x!==z.id):[...prev,z.id])} />)}
              </div>
              <div style={{ marginBottom:20 }}>
                <label htmlFor="ob-radius" style={{ fontSize:13, fontWeight:500, color:'#555', display:'block', marginBottom:8 }}>Preferred search radius: <strong>{radius} km</strong></label>
                <input id="ob-radius" type="range" min={1} max={50} value={radius} onChange={e => setRadius(parseInt(e.target.value))}
                  style={{ width:'100%', accentColor:C.coral }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#aaa' }}><span>1 km</span><span>50 km</span></div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setStep(3)} style={btnSecondary()}>← Back</button>
                <button onClick={saveLocation} style={{ flex:2, background:C.coral, color:'#fff', border:'none', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Continue →</button>
              </div>
            </div>
          )}

          {/* STEP 5 — Notifications */}
          {step===5 && (
            <div>
              <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Notification preferences</h2>
              <p style={{ fontSize:13, color:'#888', marginBottom:18 }}>Choose what you'd like to hear about. Change anytime in Account settings.</p>
              {([
                ['email_notifications',   '✉️','Email notifications',     'All alerts sent to your email'],
                ['push_notifications',    '📱','Push notifications',      'Mobile and browser push alerts'],
                ['influencer_posts',      '🔥','Influencer posts',        'When creators post about restaurants you follow'],
                ['deals_expiry',          '🎟️','Deal expiry alerts',      'Before exclusive deals expire'],
                ['weekly_digest',         '📊','Weekly food digest',      'Bengaluru food trends every Monday'],
                ['trending_food_alerts',  '📈','Trending food alerts',    'When a dish or restaurant goes viral'],
                ['restaurant_updates',    '🏪','Restaurant updates',      'News from restaurants you\'ve saved'],
                ['marketing',             '📣','Marketing & updates',     'New features and platform news'],
              ] as [keyof typeof notifs,string,string,string][]).map(([key,icon,label,sub]) => (
                <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 0', borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:18 }}>{icon}</span>
                    <div><div style={{ fontSize:13, fontWeight:600 }}>{label}</div><div style={{ fontSize:11, color:'#888' }}>{sub}</div></div>
                  </div>
                  <Toggle id={`n-${key}`} on={notifs[key]} onToggle={() => setNotifs(n=>({...n,[key]:!n[key]}))} />
                </div>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button onClick={() => setStep(4)} style={btnSecondary()}>← Back</button>
                <button onClick={finish} disabled={saving} style={{ flex:2, background:C.coral, color:'#fff', border:'none', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:600, cursor:'pointer', opacity:saving?0.7:1, fontFamily:'inherit' }}>
                  {saving?'Saving...':'Complete setup →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// INFLUENCER FLOW — 5 steps
// ═══════════════════════════════════════════════════════════════
function InfluencerOnboarding({ userId, name: initName }: { userId:string; name:string }) {
  const router = useRouter()
  const [step, setStep]           = useState(1)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [fullName, setFullName]   = useState(initName)
  const [username, setUsername]   = useState('')
  const [bio, setBio]             = useState('')
  const [city, setCity]           = useState('Bengaluru')
  const [instagram, setInstagram] = useState('')
  const [youtube, setYoutube]     = useState('')
  const [language, setLanguage]   = useState('en')
  const [audience, setAudience]   = useState('')
  const [contentTypes, setContentTypes] = useState<string[]>([])
  const [cuisines, setCuisines]   = useState<string[]>([])
  const [notifs, setNotifs]       = useState({ email_notifications:true, push_notifications:true, collaboration_notifications:true, influencer_posts:false, restaurant_updates:true, trending_food_alerts:true, marketing:false })
  const LABELS = ['Welcome','Profile','Content','Preferences','Notifications']
  const TOTAL  = 5

  const inputStyle = { width:'100%', boxSizing:'border-box' as const, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', fontSize:14, outline:'none', fontFamily:'inherit' }
  const btnSecondary = () => ({ flex:1 as const, background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'11px 0', fontSize:13, color:'#666', cursor:'pointer', fontFamily:'inherit' })

  async function saveProfile() {
    const fullNameErr = nameError(fullName, 'Full name')
    if (fullNameErr) { setError(fullNameErr); return }
    const instaErr = instagramHandleError(instagram, { required: true })
    if (instaErr) { setError(instaErr); return }
    setSaving(true); setError('')
    const res = await fetch('/api/profile', {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ full_name:fullName.trim(), username:username||undefined, bio:bio||undefined, city, preferred_language:language, instagram_handle:instagram.replace('@',''), influencer_youtube:youtube||undefined, audience_size_range:audience||undefined }),
    })
    setSaving(false)
    if (!res.ok) { const j=await res.json(); setError(j.error||'Failed to save profile.'); return }
    setStep(3)
  }

  async function finish() {
    setSaving(true); setError('')

    // This is the actual deliverable of "creator signup": a row in the
    // public `influencers` table (what /influencers, restaurant "Find
    // influencers", and connection requests all read from) — separate from
    // `profiles`, and nothing used to create it, so a creator could finish
    // this whole wizard and never appear anywhere. Do this first, and
    // surface a real error if it fails rather than silently continuing to
    // the "you're all set" screen.
    const baseSlug = fullName.trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').slice(0,50) || 'creator'
    const initials = fullName.trim().split(/\s+/).slice(0,2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'FC'
    const { error: infErr } = await (supabase as any).from('influencers').upsert([{
      profile_id: userId,
      slug: `${baseSlug}-${Date.now().toString(36)}`,
      name: fullName.trim(),
      handle: instagram.trim().replace(/^@/,''),
      avatar_initials: initials,
      bio: bio || null,
      platform: youtube.trim() ? 'both' : 'instagram',
      cuisine_tags: cuisines,
      // listing_status/approved_at/rejection_reason are locked server-side
      // to 'pending_review' on insert (see migration_013) no matter what we
      // send — an admin has to approve before this is publicly visible.
    }], { onConflict: 'profile_id' })

    if (infErr) {
      setSaving(false)
      setError('Could not create your creator listing. Please try again.')
      return
    }

    // Best-effort — preferences/profile bookkeeping, not the core deliverable.
    await Promise.all([
      fetch('/api/preferences', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ preferred_cuisines:cuisines, notification_prefs:notifs }) }),
      (supabase as any).from('profiles').update({ onboarding_complete:true, onboarding_role:'influencer', content_types:contentTypes }).eq('id', userId),
      (supabase as any).from('onboarding_progress').upsert([{ user_id:userId, flow_type:'influencer', completed_at:new Date().toISOString() }]),
    ]).catch(()=>{})
    setSaving(false); setStep(6)
  }

  if (step===6) return (
    <div style={{ minHeight:'100vh', background:'#fafafa', fontFamily:'-apple-system,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:440 }}>
        <div style={{ fontSize:64, marginBottom:16 }}>✨</div>
        <h1 style={{ fontSize:24, fontWeight:700, marginBottom:8 }}>Welcome to the creator programme!</h1>
        <p style={{ fontSize:14, color:'#666', lineHeight:1.7, marginBottom:28 }}>Your creator profile has been submitted. Our team reviews new profiles within 24-48 hours -- once approved, restaurants can find you and send collaboration requests.</p>
        <button onClick={() => router.push('/influencers')} style={{ background:C.purple, color:'#fff', border:'none', borderRadius:12, padding:'13px 32px', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>View influencer directory →</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#fafafa', fontFamily:'-apple-system,sans-serif' }}>
      <nav style={{ background:'#fff', borderBottom:`1px solid ${C.border}`, padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Link href="/" style={{ fontWeight:700, fontSize:16, textDecoration:'none', color:'#1a1a1a' }}>Food<span style={{ color:C.coral }}>Culture</span>.ai</Link>
        <span style={{ fontSize:13, color:'#888' }}>Creator setup</span>
      </nav>
      <div style={{ maxWidth:520, margin:'0 auto', padding:'40px 24px' }}>
        {step>1 && <ProgressBar current={step-1} total={TOTAL-1} />}
        {step>1 && <StepDots steps={TOTAL-1} current={step-1} labels={LABELS.slice(1)} />}
        <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${C.border}`, padding:28 }}>
          {error && <div role="alert" style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#dc2626', marginBottom:16 }}>{error}</div>}

          {step===1 && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:52, marginBottom:16 }}>✨</div>
              <h1 style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Welcome, creator!</h1>
              <p style={{ fontSize:14, color:'#666', lineHeight:1.7, marginBottom:24 }}>FoodCulture AI connects you with Bengaluru's best restaurants. Set up your creator profile to start receiving collaboration requests and grow your audience.</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:24 }}>
                {[['🤝','Brand collabs'],['📊','Impact tracking'],['💰','Earn with food']].map(([icon,label]) => (
                  <div key={label as string} style={{ background:'#F3EFFE', border:'1px solid #d4d0f5', borderRadius:12, padding:14, textAlign:'center' }}>
                    <div style={{ fontSize:24, marginBottom:6 }}>{icon}</div>
                    <div style={{ fontSize:11, fontWeight:600, color:C.purple }}>{label}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(2)} style={{ width:'100%', background:C.purple, color:'#fff', border:'none', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Set up my creator profile →</button>
            </div>
          )}

          {step===2 && (
            <div>
              <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Your creator profile</h2>
              <p style={{ fontSize:13, color:'#888', marginBottom:20 }}>This is what restaurants see when they discover you.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label htmlFor="inf-name" style={{ fontSize:13, fontWeight:500, color:'#555', display:'block', marginBottom:6 }}>Full name <span style={{ color:C.coral }}>*</span></label>
                  <input id="inf-name" type="text" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Rahul Kumar" maxLength={100} style={inputStyle} />
                </div>
                <div>
                  <label htmlFor="inf-ig" style={{ fontSize:13, fontWeight:500, color:'#555', display:'block', marginBottom:6 }}>Instagram handle <span style={{ color:C.coral }}>*</span></label>
                  <input id="inf-ig" type="text" value={instagram} onChange={e=>setInstagram(e.target.value)} placeholder="@rahulkitchens" maxLength={50} style={inputStyle} />
                </div>
                <div>
                  <label htmlFor="inf-yt" style={{ fontSize:13, fontWeight:500, color:'#555', display:'block', marginBottom:6 }}>YouTube channel <span style={{ color:'#bbb', fontWeight:400 }}>(optional)</span></label>
                  <input id="inf-yt" type="url" value={youtube} onChange={e=>setYoutube(e.target.value)} placeholder="https://youtube.com/@channel" maxLength={100} style={inputStyle} />
                </div>
                <div>
                  <label htmlFor="inf-bio" style={{ fontSize:13, fontWeight:500, color:'#555', display:'block', marginBottom:6 }}>Bio <span style={{ color:'#bbb', fontWeight:400 }}>(optional)</span></label>
                  <textarea id="inf-bio" value={bio} onChange={e=>setBio(e.target.value)} placeholder="Bengaluru's most honest food reviewer…" maxLength={500} style={{ ...inputStyle, minHeight:70, resize:'vertical' }} />
                  <div style={{ fontSize:11, color:'#bbb', textAlign:'right' }}>{bio.length}/500</div>
                </div>
                <div>
                  <label style={{ fontSize:13, fontWeight:500, color:'#555', display:'block', marginBottom:8 }}>Approximate audience size</label>
                  <div style={{ display:'flex', gap:7 }}>
                    {[['micro','<10K'],['mid','10K–100K'],['macro','100K–1M'],['mega','1M+']].map(([val,label]) => (
                      <button key={val} type="button" onClick={()=>setAudience(val)} aria-pressed={audience===val}
                        style={{ flex:1, background:audience===val?'#F3EFFE':'#fff', border:`1px solid ${audience===val?C.purple:C.border}`, borderRadius:8, padding:'8px 4px', fontSize:11, color:audience===val?C.purple:'#666', cursor:'pointer', fontFamily:'inherit' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={saveProfile} disabled={saving||!fullName.trim()||!instagram.trim()} style={{ background:C.purple, color:'#fff', border:'none', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:600, cursor:'pointer', opacity:(!fullName.trim()||!instagram.trim()||saving)?0.6:1, fontFamily:'inherit' }}>
                  {saving?'Saving...':'Continue →'}
                </button>
              </div>
            </div>
          )}

          {step===3 && (
            <div>
              <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Your content style</h2>
              <p style={{ fontSize:13, color:'#888', marginBottom:18 }}>Select the content types you create. Restaurants match you based on this.</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:24 }}>
                {CONTENT_TYPES.map(ct => <Chip key={ct} label={ct} selected={contentTypes.includes(ct)} onToggle={()=>setContentTypes(prev=>prev.includes(ct)?prev.filter(x=>x!==ct):[...prev,ct])} />)}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setStep(2)} style={btnSecondary()}>← Back</button>
                <button onClick={() => setStep(4)} style={{ flex:2, background:C.purple, color:'#fff', border:'none', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Continue →</button>
              </div>
            </div>
          )}

          {step===4 && (
            <div>
              <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Cuisine expertise</h2>
              <p style={{ fontSize:13, color:'#888', marginBottom:18 }}>Which cuisines do you cover most? Restaurants filter by this.</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:24 }}>
                {CUISINES.map(c => <Chip key={c} label={c} selected={cuisines.includes(c)} onToggle={()=>setCuisines(prev=>prev.includes(c)?prev.filter(x=>x!==c):[...prev,c])} />)}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setStep(3)} style={btnSecondary()}>← Back</button>
                <button onClick={() => setStep(5)} style={{ flex:2, background:C.purple, color:'#fff', border:'none', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Continue →</button>
              </div>
            </div>
          )}

          {step===5 && (
            <div>
              <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Notification preferences</h2>
              <p style={{ fontSize:13, color:'#888', marginBottom:18 }}>Choose how restaurants and brands can reach you.</p>
              {([
                ['email_notifications',      '✉️','Email notifications',          'All alerts sent to your email'],
                ['push_notifications',       '📱','Push notifications',           'Mobile and browser push alerts'],
                ['collaboration_notifications','🤝','Collaboration requests',      'When a restaurant wants to work with you'],
                ['restaurant_updates',       '🏪','Restaurant updates',           'From restaurants you follow'],
                ['trending_food_alerts',     '📈','Trending food alerts',         'When food trends go viral in Bengaluru'],
                ['marketing',               '📣','Marketing & updates',           'New platform features'],
              ] as [keyof typeof notifs,string,string,string][]).map(([key,icon,label,sub]) => (
                <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 0', borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:18 }}>{icon}</span>
                    <div><div style={{ fontSize:13, fontWeight:600 }}>{label}</div><div style={{ fontSize:11, color:'#888' }}>{sub}</div></div>
                  </div>
                  <Toggle id={`in-${key}`} on={notifs[key]} onToggle={()=>setNotifs(n=>({...n,[key]:!n[key]}))} />
                </div>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button onClick={() => setStep(4)} style={btnSecondary()}>← Back</button>
                <button onClick={finish} disabled={saving} style={{ flex:2, background:C.purple, color:'#fff', border:'none', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:600, cursor:'pointer', opacity:saving?0.7:1, fontFamily:'inherit' }}>
                  {saving?'Finishing...':'Complete setup →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// OWNER FLOW (unchanged from M2 session — kept intact)
// ═══════════════════════════════════════════════════════════════
function OwnerOnboarding({ name: initialName, userId }: { name: string; userId: string }) {
  const router = useRouter()
  const [step, setStep]         = useState(1)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [restId, setRestId]     = useState<string | null>(null)
  const [fullName, setFullName] = useState(initialName)
  const [phone, setPhone]       = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [restName, setRestName] = useState('')
  const [area, setArea]         = useState('')
  const [cuisine, setCuisine]   = useState('')
  const [priceTier, setPriceTier] = useState('₹₹')
  const [openUntil, setOpenUntil] = useState('')
  const [description, setDescription] = useState('')
  const OWNER_LABELS = ['Your profile', 'Restaurant', 'Photos', 'Submit']
  const TOTAL = 4
  const inputStyle = { width:'100%', boxSizing:'border-box' as const, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', fontSize:14, outline:'none', fontFamily:'inherit' }
  const labelStyle = { fontSize:13, fontWeight:500 as const, color:'#555', display:'block' as const, marginBottom:6 }

  useEffect(() => {
    ;(supabase as any).from('onboarding_progress').select('current_step').eq('user_id', userId).single().then(({ data }: { data: any }) => { if (data?.current_step>1) setStep(data.current_step) })
    ;(supabase as any).from('restaurants').select('id,name,area_label,cuisine_tags,price_tier,open_until').eq('owner_id', userId).eq('listing_status','draft').single().then(({ data }: { data: any }) => { if (data) { setRestId(data.id); setRestName(data.name||''); setArea(data.area_label||''); setCuisine((data.cuisine_tags||[]).join(', ')); setPriceTier(data.price_tier||'₹₹'); setOpenUntil(data.open_until||'') } })
  }, [userId])

  async function saveProfile() {
    const fullNameErr = nameError(fullName, 'Full name')
    if (fullNameErr) { setError(fullNameErr); return }
    const phoneErr = phoneError(phone)
    if (phoneErr) { setError(phoneErr); return }
    setSaving(true); setError('')
    await fetch('/api/profile', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ full_name:fullName.trim(), phone:phone||undefined, instagram_handle:instagramHandle||undefined }) })
    await (supabase as any).from('onboarding_progress').upsert([{ user_id:userId, flow_type:'owner', step_profile_complete:true, current_step:2 }])
    setSaving(false); setStep(2)
  }

  async function saveListing() {
    const restNameErr = businessNameError(restName, 'Restaurant name')
    if (restNameErr) { setError(restNameErr); return }
    if (!area.trim()) { setError('Please enter the area.'); return }
    setSaving(true); setError('')
    let baseSlug = restName.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').slice(0,50)
    const { data: existing } = await (supabase as any).from('restaurants').select('slug').ilike('slug',`${baseSlug}%`)
    const slug = existing?.length>0 ? `${baseSlug}-${Date.now()}` : baseSlug
    const payload = { slug, name:restName.trim(), area_label:area.trim(), owner_id:userId, cuisine_tags:cuisine.split(',').map((s:string)=>s.trim()).filter(Boolean), price_tier:priceTier, open_until:openUntil||null, listing_status:'draft', emoji:'🍽️', ...(description?{ai_brief:description}:{}) }
    let err
    if (restId) { ;({ error:err } = await (supabase as any).from('restaurants').update(payload).eq('id', restId)) }
    else { const { data, error:ie } = await (supabase as any).from('restaurants').insert([payload]).select('id').single(); err=ie; if (data?.id) setRestId(data.id) }
    if (err) { setError('Failed to save restaurant.'); setSaving(false); return }
    await (supabase as any).from('onboarding_progress').upsert([{ user_id:userId, flow_type:'owner', step_listing_created:true, current_step:3 }])
    setSaving(false); setStep(3)
  }

  async function submitForReview() {
    setSaving(true); setError('')
    const { error:err } = await (supabase as any).from('restaurants').update({ listing_status:'pending_review', submitted_at:new Date().toISOString() }).eq('owner_id', userId).in('listing_status',['draft'])
    if (err) { setError('Failed to submit.'); setSaving(false); return }
    await (supabase as any).from('profiles').update({ onboarding_complete:true, onboarding_role:'owner' }).eq('id', userId)
    await (supabase as any).from('onboarding_progress').upsert([{ user_id:userId, flow_type:'owner', step_listing_submitted:true, completed_at:new Date().toISOString() }])
    await fetch('/api/auth/welcome', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'listing_submitted', data:{ name:fullName, restaurantName:restName } }) }).catch(()=>{})
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight:'100vh', background:'#fafafa', fontFamily:'-apple-system,sans-serif' }}>
      <nav style={{ background:'#fff', borderBottom:`1px solid ${C.border}`, padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Link href="/" style={{ fontWeight:700, fontSize:16, textDecoration:'none', color:'#1a1a1a' }}>Food<span style={{ color:C.coral }}>Culture</span>.ai</Link>
        <span style={{ fontSize:13, color:'#888' }}>Restaurant setup</span>
      </nav>
      <div style={{ maxWidth:560, margin:'0 auto', padding:'40px 24px' }}>
        <ProgressBar current={step} total={TOTAL} />
        <StepDots steps={TOTAL} current={step} labels={OWNER_LABELS} />
        <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${C.border}`, padding:28 }}>
          {error && <div role="alert" style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#dc2626', marginBottom:16 }}>{error}</div>}
          {step===1 && (
            <div>
              <h2 style={{ fontSize:18, fontWeight:700, marginBottom:18 }}>Your profile</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div><label htmlFor="ob-fname" style={labelStyle}>Full name <span style={{ color:C.coral }}>*</span></label><input id="ob-fname" type="text" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Priya Sharma" maxLength={100} autoComplete="name" style={inputStyle} /></div>
                <div><label htmlFor="ob-phone" style={labelStyle}>Phone number</label><input id="ob-phone" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" style={inputStyle} /></div>
                <div><label htmlFor="ob-ig" style={labelStyle}>Instagram handle <span style={{ fontWeight:400, color:'#aaa' }}>(optional)</span></label><input id="ob-ig" type="text" value={instagramHandle} onChange={e=>setInstagramHandle(e.target.value)} placeholder="@yourrestaurant" style={inputStyle} /></div>
                <button onClick={saveProfile} disabled={saving||!fullName.trim()} style={{ background:C.coral, color:'#fff', border:'none', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:600, cursor:'pointer', opacity:(!fullName.trim()||saving)?0.6:1, fontFamily:'inherit' }}>{saving?'Saving...':'Continue →'}</button>
              </div>
            </div>
          )}
          {step===2 && (
            <div>
              <h2 style={{ fontSize:18, fontWeight:700, marginBottom:18 }}>Your restaurant details</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {[{id:'ob-rname',label:'Restaurant name *',val:restName,set:setRestName,ph:'Dum Biryani House'},{id:'ob-area',label:'Area / neighbourhood *',val:area,set:setArea,ph:'Koramangala 5th Block'},{id:'ob-cuisine',label:'Cuisine types (comma-separated)',val:cuisine,set:setCuisine,ph:'North Indian, Biryani'},{id:'ob-open',label:'Open until',val:openUntil,set:setOpenUntil,ph:'11:30 PM'}].map(f => (
                  <div key={f.id}><label htmlFor={f.id} style={labelStyle}>{f.label}</label><input id={f.id} type="text" value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={inputStyle} /></div>
                ))}
                <div><label htmlFor="ob-desc" style={labelStyle}>Description <span style={{ fontWeight:400, color:'#aaa' }}>(optional)</span></label><textarea id="ob-desc" value={description} onChange={e=>setDescription(e.target.value)} placeholder="What makes your restaurant special…" maxLength={500} style={{ ...inputStyle, minHeight:70, resize:'vertical' }} /></div>
                <div><label style={labelStyle}>Price range</label><div style={{ display:'flex', gap:8 }}>{['₹','₹₹','₹₹₹','₹₹₹₹'].map(p => (<button key={p} type="button" onClick={()=>setPriceTier(p)} aria-pressed={priceTier===p} style={{ flex:1, background:priceTier===p?'#FEF0EA':'#fff', border:`1px solid ${priceTier===p?C.coral:C.border}`, borderRadius:8, padding:'8px 4px', fontSize:14, color:priceTier===p?C.coral:'#666', cursor:'pointer', fontWeight:priceTier===p?600:400, fontFamily:'inherit' }}>{p}</button>))}</div></div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={()=>{setError('');setStep(1)}} style={{ flex:1, background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'11px 0', fontSize:13, color:'#666', cursor:'pointer', fontFamily:'inherit' }}>← Back</button>
                  <button onClick={saveListing} disabled={saving||!restName.trim()||!area.trim()} style={{ flex:2, background:C.coral, color:'#fff', border:'none', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:600, cursor:'pointer', opacity:(!restName.trim()||!area.trim()||saving)?0.6:1, fontFamily:'inherit' }}>{saving?'Saving...':'Continue →'}</button>
                </div>
              </div>
            </div>
          )}
          {step===3 && (
            <div>
              <h2 style={{ fontSize:18, fontWeight:700, marginBottom:18 }}>Add photos</h2>
              <div style={{ border:`2px dashed ${C.border}`, borderRadius:12, padding:40, textAlign:'center', marginBottom:20, background:'#fafafa' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>📷</div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Add photos from your dashboard</div>
                <div style={{ fontSize:12, color:'#aaa' }}>JPG, PNG up to 10MB · Max 10 photos</div>
              </div>
              <div style={{ background:'#FEF9F6', border:'1px solid #f5d5c0', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#555', marginBottom:20 }}>
                💡 Skip this step — add photos from your dashboard after setup.
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>{setError('');setStep(2)}} style={{ flex:1, background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'11px 0', fontSize:13, color:'#666', cursor:'pointer', fontFamily:'inherit' }}>← Back</button>
                <button onClick={()=>{(supabase as any).from('onboarding_progress').upsert([{user_id:userId,step_images_uploaded:true,current_step:4}]);setStep(4)}} style={{ flex:2, background:C.coral, color:'#fff', border:'none', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Continue →</button>
              </div>
            </div>
          )}
          {step===4 && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🚀</div>
              <h2 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Ready to submit</h2>
              <p style={{ fontSize:13, color:'#888', marginBottom:20, lineHeight:1.7 }}>Our team reviews every listing within <strong>24–48 hours</strong>. You'll get an email when approved.</p>
              <div style={{ background:'#FEF9F6', border:'1px solid #f5d5c0', borderRadius:12, padding:16, marginBottom:24, textAlign:'left' }}>
                {['Team reviews your listing','Email sent on approval','Listing goes live publicly','Connect with creators from dashboard'].map((item,i) => (
                  <div key={item} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', fontSize:13, color:'#555' }}>
                    <span style={{ width:22, height:22, borderRadius:'50%', background:C.coral, color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</span>{item}
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>{setError('');setStep(3)}} style={{ flex:1, background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'11px 0', fontSize:13, color:'#666', cursor:'pointer', fontFamily:'inherit' }}>← Back</button>
                <button onClick={submitForReview} disabled={saving} style={{ flex:2, background:C.coral, color:'#fff', border:'none', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:600, cursor:'pointer', opacity:saving?0.7:1, fontFamily:'inherit' }}>{saving?'Submitting...':'Submit for review ✓'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ROOT — detect role, route to correct flow
// ═══════════════════════════════════════════════════════════════
export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId,  setUserId]  = useState('')
  const [role,    setRole]    = useState<'visitor'|'owner'|'influencer'|null>(null)
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')

  const init = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/signin'); return }
    const { data: p } = await (supabase as any).from('profiles').select('id,full_name,role,onboarding_complete,onboarding_role').eq('id', user.id).single()
    if (p?.onboarding_complete) { router.push(p.role==='owner'?'/dashboard':p.role==='influencer'?'/influencers':'/'); return }
    setUserId(user.id); setEmail(user.email??'')
    setName(p?.full_name??user.email?.split('@')[0]??'')
    setRole(p?.role==='owner'?'owner':p?.role==='influencer'?'influencer':'visitor')
    setLoading(false)
  }, [router])

  useEffect(() => { init() }, [init])

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa', fontFamily:'-apple-system,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:36, height:36, border:'3px solid #E85D26', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
        <div style={{ fontSize:14, color:'#888' }}>Loading your account…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (role==='influencer') return <InfluencerOnboarding userId={userId} name={name} />
  if (role==='owner')      return <OwnerOnboarding userId={userId} name={name} />
  return <VisitorOnboarding userId={userId} name={name} email={email} />
}
