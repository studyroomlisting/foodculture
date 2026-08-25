export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Saved Content', robots: { index: false, follow: false } }
export { default } from './client'
