export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import HomePageLive from '@/components/live/HomePageLive'

export const metadata: Metadata = {
  title: 'FoodCulture AI — Bengaluru Food Intelligence',
  description: 'Discover trending restaurants, viral dishes, and top food influencers in Bengaluru. Real-time AI-powered food intelligence.',
  openGraph: {
    title: 'FoodCulture AI — Bengaluru Food Intelligence',
    description: 'Discover trending restaurants, viral dishes, and top food influencers in Bengaluru.',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://foodculture.ai',
    siteName: 'FoodCulture AI',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'FoodCulture AI' }],
  },
  twitter: { card: 'summary_large_image', title: 'FoodCulture AI', description: 'Bengaluru food intelligence, powered by AI' },
}

export default function Page() { return <HomePageLive /> }
