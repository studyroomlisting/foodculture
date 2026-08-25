import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://foodculture.ai'
const SITE_NAME = 'FoodCulture AI'
const CITY = 'Bengaluru'

// ---------------------------------------------------------------------------
// Page-level metadata generators
// ---------------------------------------------------------------------------

export function homeMetadata(): Metadata {
  return {
    title: `${SITE_NAME} — ${CITY} Food Intelligence`,
    description: `Discover trending restaurants, viral dishes, and top food influencers in ${CITY}. Real-time AI-powered food intelligence.`,
    openGraph: {
      title: `${SITE_NAME} — ${CITY} Food Intelligence`,
      description: `Trending restaurants, viral dishes, and influencer impact across every ${CITY} neighbourhood.`,
      url: BASE_URL,
      siteName: SITE_NAME,
      locale: 'en_IN',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: `${SITE_NAME}`, description: `${CITY} food intelligence, powered by AI` },
    alternates: { canonical: BASE_URL },
  }
}

export function restaurantMetadata(restaurant: { name: string; area_label: string | null; rating: number; cuisine_tags: string[]; ai_brief: string | null; slug: string }): Metadata {
  const title = `${restaurant.name} — ${restaurant.area_label ?? CITY} | ${SITE_NAME}`
  const desc = restaurant.ai_brief?.slice(0, 160) ?? `${restaurant.name} in ${restaurant.area_label ?? CITY} · ${restaurant.cuisine_tags.join(', ')} · Rated ${restaurant.rating} on FoodCulture AI`
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, url: `${BASE_URL}/restaurants/${restaurant.slug}`, siteName: SITE_NAME, locale: 'en_IN', type: 'website' },
    twitter: { card: 'summary_large_image', title, description: desc },
    alternates: { canonical: `${BASE_URL}/restaurants/${restaurant.slug}` },
    robots: { index: true, follow: true },
  }
}

export function influencerMetadata(inf: { name: string; handle: string; bio: string | null; slug: string; impact_score: number }): Metadata {
  const title = `${inf.name} (${inf.handle}) — Food Influencer ${CITY} | ${SITE_NAME}`
  const desc = inf.bio?.slice(0, 160) ?? `${inf.name} — ${CITY} food creator with ${inf.impact_score}% impact score on FoodCulture AI`
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, url: `${BASE_URL}/influencers/${inf.slug}`, siteName: SITE_NAME, locale: 'en_IN', type: 'profile' },
    alternates: { canonical: `${BASE_URL}/influencers/${inf.slug}` },
  }
}

export function categoryMetadata(cat: { name: string; slug: string; description: string | null; restaurant_count: number }): Metadata {
  const title = `${cat.name} Restaurants in ${CITY} | ${SITE_NAME}`
  const desc = cat.description ?? `Discover the best ${cat.name} restaurants in ${CITY}. ${cat.restaurant_count} restaurants tracked.`
  return {
    title, description: desc,
    openGraph: { title, description: desc, url: `${BASE_URL}/categories/${cat.slug}`, siteName: SITE_NAME, locale: 'en_IN', type: 'website' },
    alternates: { canonical: `${BASE_URL}/categories/${cat.slug}` },
  }
}

export function locationMetadata(loc: { name: string; slug: string; description: string | null; restaurant_count: number }): Metadata {
  const title = `Restaurants in ${loc.name}, ${CITY} | ${SITE_NAME}`
  const desc = loc.description ?? `Find the best restaurants in ${loc.name}. ${loc.restaurant_count} restaurants listed on FoodCulture AI.`
  return {
    title, description: desc,
    openGraph: { title, description: desc, url: `${BASE_URL}/locations/${loc.slug}`, siteName: SITE_NAME, locale: 'en_IN', type: 'website' },
    alternates: { canonical: `${BASE_URL}/locations/${loc.slug}` },
  }
}

// ---------------------------------------------------------------------------
// Structured data (JSON-LD)
// ---------------------------------------------------------------------------

export function localBusinessSchema(restaurant: {
  name: string; area_label: string | null; slug: string
  rating: number; total_reviews: number; cuisine_tags: string[]
  open_until: string | null; price_tier: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    address: { '@type': 'PostalAddress', addressLocality: restaurant.area_label ?? CITY, addressRegion: 'Karnataka', addressCountry: 'IN' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: restaurant.rating, reviewCount: restaurant.total_reviews, bestRating: 5 },
    servesCuisine: restaurant.cuisine_tags,
    url: `${BASE_URL}/restaurants/${restaurant.slug}`,
    priceRange: restaurant.price_tier ?? '₹₹',
  }
}

export function breadcrumbSchema(crumbs: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  }
}

// Re-exported for backward compatibility
export { default as Breadcrumbs } from '@/components/Breadcrumbs'
