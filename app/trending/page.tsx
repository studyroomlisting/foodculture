export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Trending — FoodCulture AI', description: 'Trending restaurants and food creators in Bengaluru right now.' }
import TrendingPage from '@/components/live/TrendingPage'
export default function Page() { return <TrendingPage /> }
