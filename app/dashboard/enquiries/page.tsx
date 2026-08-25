import type { Metadata } from 'next'
export const metadata: Metadata = { robots: { index: false, follow: false } }
import EnquiriesPage from '@/components/live/EnquiriesPage'
export default function Page() { return <EnquiriesPage /> }
