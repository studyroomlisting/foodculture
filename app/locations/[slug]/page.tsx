export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import LocationPage from '@/components/live/LocationPage'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return { title: `Restaurants in ${params.slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} · Bengaluru` }
}

export default function Page({ params }: { params: { slug: string } }) {
  return <LocationPage slug={params.slug} />
}
