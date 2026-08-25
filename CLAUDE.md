# FoodCulture AI — CLAUDE.md

Project context for Claude Code, Cursor, and developers.

## What this project is

FoodCulture AI is a food intelligence and influencer marketplace platform focused on Bengaluru, India. It connects restaurants with food creators ranked by ROI data, not follower counts. Users are:

- **Visitors** — discover trending restaurants, dishes, and zones
- **Restaurant owners** — list, manage, and track their restaurant's AI intelligence score and influencer collabs
- **Food influencers** — showcase impact scores, pricing, and receive connection requests
- **Admins** — approve/reject listings, moderate reviews, manage users

## Tech stack

- **Framework**: Next.js 14 App Router + TypeScript
- **Database**: Supabase (Postgres + Auth + Storage + Realtime)
- **Hosting**: Vercel
- **Fonts**: DM Sans (body) + Playfair Display (headings) via next/font
- **Icons**: Tabler Icons (CDN)
- **Brand**: Slate & Copper — primary `#E85D26`, gold `#F5A623`, green `#2E9E55`

## File structure

```
app/                          Next.js App Router
  layout.tsx                  Root layout (fonts, global metadata)
  page.tsx                    Homepage → HomePageLive
  sitemap.ts                  Auto-generated sitemap from Supabase
  robots.ts                   robots.txt
  auth/                       signin, signup, forgot-password, callback
  restaurants/                directory + [id] detail + [id]/claim
  influencers/                directory + [id] profile
  trending/                   Trending page
  explore/                    Search/explore page
  deals/                      All active deals
  notifications/              User notification centre
  dashboard/                  Restaurant owner dashboard + listings/new + listings/[id]/edit + saved
  categories/[slug]/          Category pages (Biryani, South Indian, etc.)
  locations/[slug]/           Location/neighbourhood pages
  admin/                      Admin dashboard (listings, users, reviews, enquiries, audit)
  onboarding/                 New owner 4-step wizard

components/
  live/                       All Supabase-wired React components
  auth/                       SignInPage, SignUpPage, ForgotPasswordPage
  Nav.tsx                     Shared sticky nav with active state
  Footer.tsx                  Shared footer with links
  Skeleton.tsx                Loading skeletons + PageLoader spinner

lib/
  supabase.ts                 Typed Supabase browser client + createServerClient()
  auth.ts                     Server-side auth helpers (getUser, getProfile)
  queries.ts                  15 typed query helpers (all data fetching)
  seo.ts                      Metadata generators, JSON-LD schemas, Breadcrumbs

middleware.ts                 Route protection (dashboard → login, admin → role check)

supabase/
  schema.sql                  Run first: all 11 original tables + RLS
  migration_002.sql           Run second: profiles, auth trigger, categories,
                              locations, saved_listings, listing_claims, enquiries,
                              review_reports, audit_logs, onboarding_progress,
                              listing_images, restaurant status lifecycle

types/
  database.ts                 TypeScript types for all 20+ tables
```

## Commands

```bash
npm run dev          # local dev on :3000
npm run build        # production build
npm run lint         # ESLint
npx tsc --noEmit     # type check
```

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL       = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = eyJ...
SUPABASE_SERVICE_ROLE_KEY      = eyJ...   (server-only, not prefixed NEXT_PUBLIC_)
NEXT_PUBLIC_APP_URL            = https://foodculture.ai
NEXT_PUBLIC_CITY               = Bengaluru
```

## Supabase setup order

1. Run `supabase/schema.sql` in SQL editor
2. Run `supabase/migration_002.sql` in SQL editor
3. Run `supabase/seed.sql` in SQL editor
4. Enable Google OAuth in Supabase Auth → Providers
5. Create a `listing-images` bucket in Supabase Storage (public read, auth write)
6. Set `Site URL` and `Redirect URLs` in Supabase Auth settings to your domain

## User roles

| Role | Access |
|---|---|
| `visitor` | Browse everything public |
| `owner` | + manage own listings, view own enquiries, dashboard |
| `admin` | + approve/reject listings, all users/reviews/enquiries, audit log |

Role stored in `profiles.role`. Never trust browser-sent roles — always validate server-side via `profiles` table.

## Key design decisions

- **Slug-based URLs** — restaurants and influencers use slugs, not UUIDs, for SEO
- **listing_status lifecycle**: `draft → pending_review → approved / rejected → suspended / archived`
- **Public read RLS** — only approved listings are visible to non-owners
- **Connection fee model** — users pay a one-time fee to be introduced to an influencer; fee is charged only on acceptance
- **AI Intelligence Score** — 0–100 composite of influencer coverage, review sentiment, search volume trends
- **No follower count bias** — influencers are ranked by `impact_score` (visit conversion rate), not raw followers

## Brand colours

```
#E85D26   Copper / primary CTA
#F5A623   Gold / accent / trending
#2E9E55   Green / success / rising
#D4860A   Amber / new / warning
#1a1a1a   Slate / headings
#888888   Muted text
#ede8e2   Border
```

## What's pending (next steps)

- Real image uploads → Supabase Storage + next/image
- Transactional emails → Resend or Supabase Edge Functions
- Realtime activity feed → supabase.channel()
- AI semantic search → Claude Haiku + Voyage AI embeddings + pgvector
- E2E tests → Playwright
- Pagination → replace limit=50 with cursor-based pagination
- WCAG 2.2 AA accessibility pass
