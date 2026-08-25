export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('avatar') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!['image/jpeg','image/png','image/webp'].includes(file.type))
      return NextResponse.json({ error: 'Only JPG, PNG, and WebP are allowed.' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024)
      return NextResponse.json({ error: 'Image must be under 5MB.' }, { status: 400 })

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `avatars/${user.id}.${ext}`

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
      return NextResponse.json({ error: 'Storage not configured.' }, { status: 503 })

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const bytes = await file.arrayBuffer()
    const { error: uploadError } = await admin.storage.from('avatars').upload(path, bytes, { upsert: true, contentType: file.type })
    if (uploadError) return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })

    const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)
    await (supabase as any).from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
    return NextResponse.json({ url: publicUrl })
  } catch {
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 })
  }
}
