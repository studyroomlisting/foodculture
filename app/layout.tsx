import type { Metadata } from 'next'
import './globals.css'
import CookieConsent from '@/components/CookieConsent'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'


export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#E85D26' }

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://foodculture.ai'),
  title: { default:'FoodCulture AI — Bengaluru Food Intelligence', template:'%s | FoodCulture AI' },
  description: 'Real-time AI intelligence on restaurants, viral dishes, and influencer impact across Bengaluru.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180' }],
    shortcut: '/favicon.ico',
  },
  keywords: ['Bengaluru restaurants','food influencers India','viral food Bengaluru','restaurant discovery'],
  openGraph: {
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'FoodCulture AI — Bengaluru Food Intelligence' }], type:'website', locale:'en_IN', url:'https://foodculture.ai', siteName:'FoodCulture AI' },
  twitter: { card:'summary_large_image', creator:'@foodcultureai' },
  robots: { index:true, follow:true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={``}>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" />
      </head>
      <body style={{ margin:0, fontFamily:'var(--font-sans,-apple-system,sans-serif)' }}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <main id="main-content">
          {children}
        </main>
        <CookieConsent />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
