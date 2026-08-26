'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

const C = { coral: '#E85D26', border: '#ede8e2' }

export default function Nav() {
  const path   = usePathname()
  const router = useRouter()
  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  // Fallback signal for when profiles.role hasn't caught up with reality yet
  // (e.g. a Google-OAuth account that signed up before migration_014 was
  // applied — see that file — is stuck on 'visitor' in the DB even though
  // the person is really a restaurant owner or influencer). Only computed
  // when profile.role doesn't already resolve to something recognized, so
  // it costs nothing once the role data itself is correct.
  const [fallbackRole, setFallbackRole] = useState<'owner' | 'influencer' | null>(null)

  useEffect(() => {
    async function loadProfile(userId: string) {
      const { data } = await (supabase as any).from('profiles').select('*').eq('id', userId).single()
      setProfile(data)
      if (data && !['owner', 'influencer', 'admin'].includes(data.role)) {
        const [{ count: ownedCount }, { data: creatorRow }] = await Promise.all([
          (supabase as any).from('restaurants').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
          (supabase as any).from('influencers').select('id').eq('profile_id', userId).maybeSingle(),
        ])
        if ((ownedCount ?? 0) > 0) setFallbackRole('owner')
        else if (creatorRow) setFallbackRole('influencer')
        else setFallbackRole(null)
      } else {
        setFallbackRole(null)
      }
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      loadProfile(user.id)
      // Unread notifications count
      ;(supabase as any).from('notifications').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('is_read', false)
        .then(({ count }: any) => setNotifCount(count ?? 0))
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session?.user) { setProfile(null); setFallbackRole(null); setNotifCount(0); return }
      loadProfile(session.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setMenuOpen(false)
    router.push('/')
  }

  const navLinks = [
    { href: '/restaurants', label: 'Restaurants' },
    { href: '/influencers',  label: 'Influencers'  },
    { href: '/trending',     label: 'Trending'     },
    { href: '/explore',      label: 'Explore'      },
    { href: '/deals',        label: 'Deals'        },
  ]

  // Role-based dashboard link. Falls back to `fallbackRole` (derived from
  // actually owning a listing / creator profile) when profiles.role hasn't
  // been fixed up yet — see the loadProfile() note above.
  const getDashLink = () => {
    if (!profile) return null
    const role = (profile as any).role
    if (role === 'admin') return '/admin'
    if (role === 'owner' || fallbackRole === 'owner') return '/dashboard'
    if (role === 'influencer' || fallbackRole === 'influencer') return '/dashboard/influencer'
    return null
  }
  const dashLink = getDashLink()

  // Friendly role label for the profile dropdown — the raw DB value
  // ('owner'/'influencer'/'visitor'/'admin') read fine capitalized, but
  // reads better spelled out to match how the site refers to each role
  // elsewhere (signup role picker, account page badge).
  const roleLabel = (() => {
    switch ((profile as any)?.role) {
      case 'owner':      return 'Restaurant owner'
      case 'influencer': return 'Influencer'
      case 'admin':       return 'Admin'
      default:
        if (fallbackRole === 'owner') return 'Restaurant owner'
        if (fallbackRole === 'influencer') return 'Influencer'
        return 'Food explorer'
    }
  })()

  const menuItems = [
    { href: dashLink ?? '',              label: 'Dashboard',       icon: '📊', show: !!dashLink },
    { href: '/account',                  label: 'My profile',      icon: '👤', show: true },
    { href: '/account/saved',            label: 'Saved listings',  icon: '❤️', show: true },
    { href: '/account/notifications',    label: 'Notifications',   icon: '🔔', show: true },
    { href: '/account/activity',         label: 'Activity',        icon: '🕐', show: true },
    { href: '/account/security',         label: 'Security',        icon: '🔒', show: true },
    { href: '/account/delete',           label: 'Delete account',  icon: '🗑️', show: true },
    { href: '/admin',                    label: 'Admin panel',     icon: '🛡️', show: (profile as any)?.role === 'admin' },
  ]

  return (
    <nav role="navigation" aria-label="Main navigation"
      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', background:'#fff', borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, zIndex:50 }}>

      {/* Logo */}
      <Link href="/" aria-label="FoodCulture AI home"
        style={{ fontWeight:700, fontSize:16, textDecoration:'none', color:'#1a1a1a', display:'flex', alignItems:'center', gap:8 }}>
        <span aria-hidden="true" style={{ width:30, height:30, background:C.coral, borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🔥</span>
        Food<span style={{ color:C.coral }}>Culture</span>.ai
      </Link>

      {/* Main nav links */}
      <div style={{ display:'flex', gap:4 }}>
        {navLinks.map(l => {
          const active = path === l.href || path.startsWith(l.href + '/')
          return (
            <Link key={l.href} href={l.href} aria-current={active ? 'page' : undefined}
              style={{ fontSize:13, padding:'6px 14px', borderRadius:20, textDecoration:'none', background: active ? '#FEF0EA' : 'transparent', color: active ? C.coral : '#666', fontWeight: active ? 600 : 400 }}>
              {l.label}
            </Link>
          )
        })}
      </div>

      {/* Right side */}
      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        {/* Notification bell */}
        <Link href="/account/notifications" aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} unread)` : ''}`}
          style={{ position:'relative', fontSize:20, textDecoration:'none', color:'#666', lineHeight:1 }}>
          🔔
          {notifCount > 0 && (
            <span style={{ position:'absolute', top:-4, right:-4, width:16, height:16, background:C.coral, borderRadius:'50%', fontSize:9, fontWeight:800, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </Link>

        {profile ? (
          <div style={{ position:'relative' }}>
            <button onClick={() => setMenuOpen(o => !o)} aria-expanded={menuOpen} aria-haspopup="true" aria-label="Account menu"
              style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', border:`1px solid ${C.border}`, borderRadius:24, padding:'6px 14px 6px 6px', cursor:'pointer', fontSize:13 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'#FEF0EA', color:C.coral, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, flexShrink:0, overflow:'hidden' }}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.full_name ?? 'Avatar'} style={{ width:28, height:28, objectFit:'cover' }} />
                  : (profile.full_name?.charAt(0) ?? '?').toUpperCase()}
              </div>
              <span style={{ maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {profile.full_name?.split(' ')[0] ?? 'Account'}
              </span>
              <span aria-hidden="true" style={{ fontSize:10, color:'#aaa' }}>▾</span>
            </button>

            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position:'fixed', inset:0, zIndex:40 }} aria-hidden="true" />
                <div role="menu" style={{ position:'absolute', right:0, top:'calc(100% + 8px)', background:'#fff', border:`1px solid ${C.border}`, borderRadius:12, padding:8, minWidth:190, zIndex:50, boxShadow:'0 4px 20px rgba(0,0,0,.08)' }}>
                  {/* Profile header */}
                  <div style={{ padding:'8px 12px', borderBottom:`1px solid ${C.border}`, marginBottom:4 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{profile.full_name}</div>
                    <div style={{ fontSize:11, color:'#888' }}>{roleLabel}</div>
                  </div>
                  {/* Menu items */}
                  {menuItems.filter(i => i.show).map(item => (
                    <Link key={item.href} href={item.href} role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, fontSize:13, color:'#1a1a1a', textDecoration:'none' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background='#f5f0eb')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background='transparent')}>
                      <span aria-hidden="true">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                  {/* Sign out */}
                  <div style={{ borderTop:`1px solid ${C.border}`, marginTop:4, paddingTop:4 }}>
                    <button onClick={signOut} role="menuitem"
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, fontSize:13, color:'#dc2626', background:'none', border:'none', cursor:'pointer', width:'100%', textAlign:'left', fontFamily:'inherit' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background='#fef2f2')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background='transparent')}>
                      🚪 Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ display:'flex', gap:8 }}>
            <Link href="/auth/signin" style={{ fontSize:13, color:'#666', textDecoration:'none', padding:'8px 14px', borderRadius:20 }}>Sign in</Link>
            <Link href="/auth/signup" style={{ background:C.coral, color:'#fff', borderRadius:20, padding:'8px 18px', fontSize:13, fontWeight:600, textDecoration:'none' }}>Get started</Link>
          </div>
        )}
      </div>
    </nav>
  )
}
