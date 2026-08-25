export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MAX_ATTEMPTS  = 10   // lock after 10 failures
const LOCKOUT_MINS  = 30   // locked for 30 minutes

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string' || email.length > 254) {
      return NextResponse.json({ ok: true })
    }

    const maskedEmail = email.replace(/(?<=.{2}).(?=.*@)/g, '*')
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

    // Only proceed with lockout tracking if service role key available
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      // Find the user by email
      const { data: users } = await admin.auth.admin.listUsers()
      const authUser = users?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

      if (authUser) {
        const userId = authUser.id

        // Get current profile
        const { data: profile } = await (admin as any)
          .from('profiles')
          .select('failed_login_count, locked_at')
          .eq('id', userId)
          .single()

        if (profile) {
          // If already locked, don't increment further
          if (profile.locked_at) {
            // Check if lockout period has expired
            const lockedAt   = new Date(profile.locked_at).getTime()
            const expiry     = lockedAt + LOCKOUT_MINS * 60 * 1000
            if (Date.now() < expiry) {
              // Still locked — log attempt and return
              await (admin as any).from('audit_logs').insert([{
                actor_id: userId, action: 'auth.login_failed',
                target_table: 'auth.users', target_id: userId,
                metadata: { email_masked: maskedEmail, ip, reason: 'account_locked' },
              }]).catch(() => {})
              return NextResponse.json({ ok: true, locked: true })
            } else {
              // Lockout expired — reset counter
              await (admin as any).from('profiles').update({
                failed_login_count: 1, locked_at: null, locked_reason: null,
              }).eq('id', userId)
            }
          } else {
            const newCount = (profile.failed_login_count || 0) + 1
            const shouldLock = newCount >= MAX_ATTEMPTS

            await (admin as any).from('profiles').update({
              failed_login_count: newCount,
              last_failed_login_at: new Date().toISOString(),
              ...(shouldLock ? {
                locked_at: new Date().toISOString(),
                locked_reason: `Locked after ${MAX_ATTEMPTS} failed login attempts`,
              } : {}),
            }).eq('id', userId)

            // Audit log
            await (admin as any).from('audit_logs').insert([{
              actor_id: userId, action: 'auth.login_failed',
              target_table: 'auth.users', target_id: userId,
              metadata: { email_masked: maskedEmail, ip, attempt: newCount, locked: shouldLock },
            }]).catch(() => {})

            if (shouldLock) {
              await (admin as any).from('audit_logs').insert([{
                actor_id: userId, action: 'auth.account_locked',
                target_table: 'auth.users', target_id: userId,
                metadata: { reason: `${MAX_ATTEMPTS} failed attempts`, ip },
              }]).catch(() => {})
              return NextResponse.json({ ok: true, locked: true, attempts: newCount })
            }
            return NextResponse.json({ ok: true, locked: false, attempts: newCount, remaining: MAX_ATTEMPTS - newCount })
          }
        }
      }
    }

    // Fallback: just log anonymously (no service role key)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
