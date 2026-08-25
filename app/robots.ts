import { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://foodculture.ai'
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/dashboard', '/auth', '/api'] },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
