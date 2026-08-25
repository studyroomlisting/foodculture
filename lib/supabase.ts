/**
 * lib/supabase.ts — Supabase client factories
 *
 * Lazy initialization: clients are created on first use, not at module load.
 * This allows the build to succeed without NEXT_PUBLIC_SUPABASE_* env vars.
 *
 * Three clients:
 *  supabase          — browser singleton (anon key, RLS enforced)
 *  createRLSClient() — server-side (anon key, RLS enforced)
 *
 * NEVER use service role key here. Only in explicit /api/admin/* routes.
 *
 * IMPORTANT: the browser singleton MUST be created with `createBrowserClient`
 * from `@supabase/ssr` (not the plain `createClient` from
 * `@supabase/supabase-js`). `@supabase/supabase-js`'s createClient stores the
 * session/PKCE code_verifier in localStorage; `@supabase/ssr`'s
 * createServerClient (used in middleware.ts and app/auth/callback/route.ts)
 * only reads cookies. With the two mismatched, Google OAuth sign-in returned
 * tokens directly in a URL hash fragment (#access_token=...) instead of the
 * expected ?code=... query param, and /auth/callback saw no `code` and
 * bounced to /auth/signin?error=code_missing. createBrowserClient stores the
 * session in cookies, matching the server-side client, and defaults to the
 * PKCE flow the callback route expects.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return { url, key }
}

// ─── Browser singleton — lazy ─────────────────────────────────────────────
let _supabase: SupabaseClient<Database> | null = null

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    if (!_supabase) {
      const env = getEnv()
      if (!env) {
        // Return a no-op during build — queries will return empty/error
        return () => ({ data: null, error: new Error('Supabase not configured') })
      }
      _supabase = createBrowserClient<Database>(env.url, env.key)
    }
    const val = (_supabase as any)[prop]
    return typeof val === 'function' ? val.bind(_supabase) : val
  },
})

// ─── Server-side RLS-enforced client ─────────────────────────────────────
export function createRLSClient(): SupabaseClient<Database> {
  const env = getEnv()
  if (!env) throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
  return createClient<Database>(env.url, env.key, { auth: { persistSession: false } })
}

// @deprecated Use createRLSClient()
export const createServerClient = createRLSClient
