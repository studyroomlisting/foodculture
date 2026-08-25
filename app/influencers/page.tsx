import type { Metadata } from 'next'
import InfluencerDirectoryLive from '@/components/live/InfluencerDirectoryLive'
export const metadata: Metadata = {
  title: 'Food Influencers in Bengaluru',
  description: 'Discover top food creators ranked by real visit impact. Connect with Bengaluru\'s best food influencers.',
}
export default function Page() { return <InfluencerDirectoryLive /> }
