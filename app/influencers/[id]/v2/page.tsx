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

export default function Page({ params }: { params: { id: string } }) {
  return <InfluencerProfileLive slug={params.id} />
}
