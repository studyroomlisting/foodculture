export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Deals — FoodCulture AI', description: 'Best food deals in Bengaluru today.' }
import DealsPage from '@/components/live/DealsPage'
export default function Page() { return <DealsPage /> }
