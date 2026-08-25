export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { getInfluencerBySlug } from '@/lib/queries'
import { influencerMetadata } from '@/lib/seo'
import InfluencerProfileLive from '@/components/live/InfluencerProfileLive'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const inf = await getInfluencerBySlug(params.id)
    if (!inf) return { title: 'Influencer not found' }
    return influencerMetadata(inf)
  } catch { return { title: 'FoodCulture AI' } }
}

export default async function Page({ params }: { params: { id: string } }) {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://foodculture.ai'
  let jsonLd: string | null = null
  try {
    const inf = await getInfluencerBySlug(params.id)
    if (inf) {
      const schema = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": inf.name,
        "url": `${BASE_URL}/influencers/${inf.slug}`,
        "description": inf.bio ?? `Food influencer in Bengaluru with ${inf.followers_count?.toLocaleString('en-IN')} followers.`,
        "sameAs": inf.handle ? [`https://www.instagram.com/${inf.handle}/`] : [],
        "interactionStatistic": [{
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/FollowAction",
          "userInteractionCount": inf.followers_count ?? 0,
        }],
      }
      jsonLd = JSON.stringify(schema)
    }
  } catch { /* non-critical */ }

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}
      <InfluencerProfileLive slug={params.id} />
    </>
  )
}
