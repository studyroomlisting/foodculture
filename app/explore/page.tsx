export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import ExplorePageLive from '@/components/live/ExplorePageLive'
export const metadata: Metadata = {
  title: 'Explore Bengaluru Food',
  description: 'Search restaurants, influencers, and food zones across Bengaluru.',
}
export default function Page() { return <ExplorePageLive /> }
