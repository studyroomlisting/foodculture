import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Claim Listing', robots: { index: false, follow: false } }
import ClaimListingPage from '@/components/live/ClaimListingPage'
export default function Page({ params }: { params: { id: string } }) {
  return <ClaimListingPage slug={params.id} />
}
