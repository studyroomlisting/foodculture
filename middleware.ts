import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

declare global {
  // eslint-disable-next-line no-var
  var __fc_env_warned: boolean | undefined
}

const PROTECTED_ROUTES  = ['/dashboard', '/onboarding', '/account', '/notifications', '/account/history', '/account/security', '/account/notifications', '/account/saved', '/account/activity', '/account/privacy']
const ADMIN_ROUTES      = ['/admin']
const AUTH_ROUTES       = ['/auth/signin', '/auth/signup', '/auth/forgot-password']
// /auth/reset-password is NOT in AUTH_ROUTES — users need access whether logged in or not

// Simple in-memory rate limiter (per IP, resets on cold start)
// For production use Upstash Redis or Vercel KV
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/auth/signin':           { max: 10, windowMs: 60_000 },
  '/auth/signup':           { max: 5,  windowMs: 60_000 },
  '/auth/forgot-password':  { max: 3,  windowMs: 300_000 },
  '/api/enquiry':           { max: 5,  windowMs: 60_000 },
  '/api/connect':           { max: 3,  windowMs: 60_000 },
  '/api/admin':             { max: 30, windowMs: 60_000 },
}

function checkRateLimit(ip: string, path: string): boolean {
  const rule = Object.entries(RATE_LIMITS).find(([p]) => path.startsWith(p))
  if (!rule) return true

  const [, { max, windowMs }] = rule
  const key = `${ip}:${rule[0]}`
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1'

  // Rate limiting check
  if (!checkRateLimit(ip, pathname)) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
    )
  }

  let response = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Supabase isn't configured yet (missing/unfilled .env.local).
  // Don't crash every request — log once per cold start and skip
  // auth/session logic. Protected routes will simply not be enforced
  // until real credentials are added.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (!globalThis.__fc_env_warned) {
      console.warn(
        '[middleware] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. ' +
        'Copy .env.example to .env.local and fill in your Supabase project URL + anon key ' +
        '(Supabase dashboard → Settings → API), then restart `npm run dev`. ' +
        'Auth-protected routes will not be enforced until this is fixed.'
      )
      globalThis.__fc_env_warned = true
    }
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect logged-in users away from auth pages. Used to always send them
  // to /dashboard regardless of a ?next= param — so a logged-in user who
  // followed e.g. /auth/signin?next=/account/security (a link from
  // somewhere that needed them logged in) got bounced to /dashboard instead
  // of the page they were actually headed to.
  if (user && AUTH_ROUTES.some(r => pathname.startsWith(r))) {
    const next = request.nextUrl.searchParams.get('next')
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
    return NextResponse.redirect(new URL(safeNext, request.url))
  }

  // Protect dashboard / onboarding
  if (!user && PROTECTED_ROUTES.some(r => pathname.startsWith(r))) {
    const url = new URL('/auth/signin', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Protect admin routes
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/signin?next=' + pathname, request.url))
    }
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https://images.unsplash.com https://*.supabase.co https://lh3.googleusercontent.com; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self' https://*.supabase.co;"
  )
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
