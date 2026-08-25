export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import RestaurantDirectoryLive from '@/components/live/RestaurantDirectoryLive'
export const metadata: Metadata = {
  title: 'Restaurants in Bengaluru',
  description: 'Browse and filter trending restaurants across Bengaluru. Discover viral spots, new openings, and rising gems.',
}
export default function Page() { return <RestaurantDirectoryLive /> }
