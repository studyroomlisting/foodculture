export const dynamic = 'force-dynamic'
import { MetadataRoute } from 'next'
import { createSupabaseServerClient } from '@/lib/auth'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://foodculture.ai'
  const supabase = await createSupabaseServerClient()

  const [{ data: restaurants }, { data: influencers }, { data: categories }, { data: locations }] = await Promise.all([
    (supabase as any).from('restaurants').select('slug,updated_at').eq('listing_status','approved'),
    (supabase as any).from('influencers').select('slug,created_at'),
    (supabase as any).from('categories').select('slug'),
    (supabase as any).from('locations').select('slug'),
  ])

  const staticRoutes = ['/', '/restaurants', '/influencers', '/trending', '/explore', '/deals'].map(route => ({
    url: `${BASE}${route}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: route === '/' ? 1 : 0.8,
  }))

  const restaurantRoutes = (restaurants ?? []).map(r => ({
    url: `${BASE}/restaurants/${r.slug}`, lastModified: new Date(r.updated_at), changeFrequency: 'weekly' as const, priority: 0.7,
  }))

  const influencerRoutes = (influencers ?? []).map(i => ({
    url: `${BASE}/influencers/${i.slug}`, lastModified: new Date(i.created_at), changeFrequency: 'weekly' as const, priority: 0.6,
  }))

  const categoryRoutes = (categories ?? []).map(c => ({
    url: `${BASE}/categories/${c.slug}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.6,
  }))

  const locationRoutes = (locations ?? []).map(l => ({
    url: `${BASE}/locations/${l.slug}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.5,
  }))

  return [...staticRoutes, ...restaurantRoutes, ...influencerRoutes, ...categoryRoutes, ...locationRoutes]
}
