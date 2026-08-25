export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Privacy Settings', robots: { index: false, follow: false } }
export { default } from './client'
