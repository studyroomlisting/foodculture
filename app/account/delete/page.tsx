import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Delete Account', robots: { index: false, follow: false } }
import AccountDeletionPage from '@/components/live/AccountDeletionPage'
export default function Page() { return <AccountDeletionPage /> }
