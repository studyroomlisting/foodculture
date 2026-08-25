export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  return { title: `@${params.username} · FoodCulture AI` }
}
export { default } from './client'
