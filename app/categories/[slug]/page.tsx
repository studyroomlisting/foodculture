export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import CategoryPage from '@/components/live/CategoryPage'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return { title: `${params.slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} Restaurants · Bengaluru` }
}

export default function Page({ params }: { params: { slug: string } }) {
  return <CategoryPage slug={params.slug} />
}
