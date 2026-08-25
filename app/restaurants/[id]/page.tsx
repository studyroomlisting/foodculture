export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { getRestaurantBySlug } from '@/lib/queries'
import { restaurantMetadata } from '@/lib/seo'
import RestaurantDetailLive from '@/components/live/RestaurantDetailLive'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const restaurant = await getRestaurantBySlug(params.id)
    if (!restaurant) return { title: 'Restaurant not found' }
    return restaurantMetadata(restaurant)
  } catch { return { title: 'FoodCulture AI' } }
}

export default async function Page({ params }: { params: { id: string } }) {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://foodculture.ai'
  let jsonLd: string | null = null
  try {
    const r = await getRestaurantBySlug(params.id)
    if (r) {
      const schema = {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        "name": r.name,
        "url": `${BASE_URL}/restaurants/${r.slug}`,
        "description": r.ai_brief ?? `${r.name} — ${r.cuisine_tags?.join(', ')} restaurant in ${r.area_label}, Bengaluru.`,
        "servesCuisine": r.cuisine_tags ?? [],
        "priceRange": r.price_tier ?? "₹₹",
        "address": { "@type": "PostalAddress", "addressLocality": r.area_label ?? "Bengaluru", "addressRegion": "Karnataka", "addressCountry": "IN" },
        "aggregateRating": r.rating ? { "@type": "AggregateRating", "ratingValue": r.rating, "bestRating": 5, "ratingCount": r.total_reviews ?? 1 } : undefined,
      }
      jsonLd = JSON.stringify(schema)
    }
  } catch { /* non-critical */ }

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}
      <RestaurantDetailLive slug={params.id} />
    </>
  )
}
