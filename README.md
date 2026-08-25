# FoodCulture AI

**Bengaluru Food Intelligence & Influencer Marketplace**

> Connect restaurants with food creators ranked by real visit conversion rates — not follower counts.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key
npm run dev                   # http://localhost:3000
```

## Database setup (one-time)

Run in Supabase SQL Editor **in this exact order**:

1. `supabase/schema.sql` — 12 core tables + RLS + triggers
2. `supabase/migration_002.sql` — 12 additional tables + auth trigger
3. `supabase/seed.sql` — 16 restaurants, 8 influencers, full Bengaluru data

Then in Supabase → Storage → New bucket → `listing-images` (public).

## Project structure

```
├── app/                    38 routes (Next.js 14 App Router)
│   ├── page.tsx / client.tsx (server/client split pattern)
│   ├── restaurants/[id]/
│   ├── influencers/[id]/
│   ├── dashboard/
│   ├── admin/
│   ├── auth/
│   └── api/
├── components/
│   ├── live/               37 Supabase-wired page components
│   ├── auth/               SignInPage, SignUpPage, ForgotPasswordPage
│   ├── Nav.tsx             Full auth state, role dropdown
│   ├── Footer.tsx          All links
│   ├── RestaurantCard.tsx  Card with image + stats
│   ├── InfluencerCard.tsx  Card with impact metrics
│   └── Breadcrumbs.tsx
├── lib/
│   ├── queries.ts          All Supabase read queries
│   ├── auth.ts             Server-side auth helpers
│   ├── email.ts            7 Resend transactional emails
│   ├── storage.ts          Supabase Storage helpers
│   └── seo.tsx             generateMetadata helpers + JSON-LD
├── supabase/
│   ├── schema.sql
│   ├── migration_002.sql
│   └── seed.sql
├── types/database.ts       TypeScript types for all 24 tables
├── middleware.ts            Route protection + rate limiting + security headers
├── public/mockups/         HTML UI mockups (foodculture-all-pages.html)
├── 05-database/            39 database documentation files
│   ├── README.md
│   ├── RUN_ORDER.md
│   ├── DATABASE_SCHEMA.md
│   ├── FORM_TO_DATABASE_MAPPING.md
│   ├── ERD.md
│   ├── TABLES/             24 table docs
│   └── verification/       7 SQL verification files
├── docs/
│   ├── SCOPE_REQUIREMENTS.md
│   ├── PROMPTS.md
│   ├── DECISIONS.md
│   └── FEATURES.md
└── tests/e2e.spec.ts       30+ Playwright E2E tests
```

## Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # admin emails
RESEND_API_KEY=                  # transactional email
EMAIL_FROM=                      # e.g. FoodCulture AI <hello@foodculture.ai>
NEXT_PUBLIC_APP_URL=             # e.g. https://foodculture.ai
```

## Deploy to Vercel

```bash
# 1. Push to GitHub
# 2. Import project on vercel.com
# 3. Add environment variables
# 4. Deploy — done
```

## Key docs

| Document | Location |
|---|---|
| Scope requirements | `docs/SCOPE_REQUIREMENTS.md` |
| Build prompts | `docs/PROMPTS.md` |
| Architecture decisions | `docs/DECISIONS.md` |
| Feature inventory | `docs/FEATURES.md` |
| Database schema | `05-database/DATABASE_SCHEMA.md` |
| Form → DB mapping | `05-database/FORM_TO_DATABASE_MAPPING.md` |
| ERD | `05-database/ERD.md` |
| UI mockups | `public/mockups/foodculture-all-pages.html` |

## Tech stack

Next.js 14 · TypeScript · Supabase PostgreSQL · Supabase Auth · Supabase Storage · Supabase Realtime · Vercel · Resend · Tabler Icons · Playwright · @vercel/analytics

---

© 2026 FoodCulture AI · Bengaluru, India
