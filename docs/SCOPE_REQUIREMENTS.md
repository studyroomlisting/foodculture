# FoodCulture AI — Scope Requirements Document
**Project**: FoodCulture AI — Bengaluru Food Intelligence & Influencer Marketplace
**Version**: 2.0 | **Date**: July 2026 | **Stack**: Next.js 14 + Supabase + Vercel

---

## 1. Project Overview

FoodCulture AI is a food intelligence and influencer marketplace platform focused on Bengaluru, India. The platform connects restaurants with food content creators matched on ROI data (visit conversion rates) rather than follower counts, and provides food discovery services to the public.

### 1.1 Core Value Proposition
- **For restaurant owners**: AI-powered intelligence dashboard showing real-time trend scores, influencer impact data, and competitive positioning
- **For food creators**: A ranked marketplace where creators are valued by visits driven, not vanity metrics
- **For food lovers**: The best discovery tool for Bengaluru's food scene, powered by live data

### 1.2 Target Users
| User Type | Description |
|---|---|
| Visitor | Food lovers browsing restaurants, saving favourites, writing reviews |
| Restaurant Owner | Business owner listing, managing, and promoting their restaurant |
| Admin | FoodCulture AI staff moderating listings, reviews, and claims |

---

## 2. Functional Requirements

### 2.1 Public Pages (no login required)
- Homepage with live activity feed, trending restaurants, trending dishes, zone heat map
- Restaurant directory with search, zone filter, category filter, price filter, sort
- Restaurant detail page with AI brief, reviews, deals, influencer posts, booking form, enquiry form
- Influencer directory with search, platform filter, niche filter, follower filter
- Influencer profile with impact stats, pricing packages, recent posts, connect CTA
- Trending page with viral dishes, hottest zones, creator leaderboard
- Explore page with unified search across restaurants + influencers + zones
- Deals page showing all active restaurant deals with promo codes
- Category pages (Biryani, South Indian, Street Food, Burgers, Seafood, Cafes, Fine Dining, Desserts)
- Location/neighbourhood pages (Koramangala, Indiranagar, HSR Layout, etc.)
- Terms of Service and Privacy Policy pages

### 2.2 Auth Features
- Email + password sign up and sign in
- Google OAuth sign up and sign in
- Magic link (passwordless) sign in
- Forgot password / password reset via email
- Role selection on signup: Visitor or Restaurant Owner
- Auto-creation of user profile on signup (DB trigger)
- Sign out

### 2.3 Visitor Features (login required)
- Save / bookmark restaurants (heart toggle)
- View saved listings at `/dashboard/saved`
- Write reviews on restaurant detail page
- Submit enquiry forms (no login required actually — public)
- View notifications

### 2.4 Restaurant Owner Features (login required)
- 4-step onboarding wizard: Profile → Restaurant details → Photo upload → Submit for review
- Owner dashboard with KPIs: AI Score, visits from influencers, profile views, avg rating
- Weekly visits bar chart
- Influencer posts feed
- Enquiry inbox with reply, mark read, mark spam
- Create listing (full form)
- Edit listing
- Photo upload (drag-drop, Supabase Storage)
- Submit listing for admin review
- View listing status (draft → pending_review → approved)
- Claim unclaimed listing

### 2.5 Admin Features (login required, admin role only)
- Admin dashboard with 7 tabs: Listings, Users, Reviews, Enquiries, Claims, Audit
- Approve / reject / suspend listings
- View and delete reviews
- View all enquiries
- Approve / reject ownership claim requests
- Full audit log of all admin actions

### 2.6 Email Notifications (Resend)
- Welcome email on new signup
- Listing submitted confirmation
- Listing approved notification
- Listing rejected notification (with reason)
- New enquiry notification to restaurant owner
- Enquiry confirmation to sender
- Connection request notification to influencer

### 2.7 Account & Settings
- Edit personal information (name, email, phone, city)
- Notification preferences (toggles per notification type)
- Booking history
- Security page: change password, 2FA, connected accounts, active sessions, login history
- Account deletion (GDPR — removes PII, anonymises reviews)
- Cookie consent banner

---

## 3. Non-Functional Requirements

### 3.1 Performance
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Homepage and trending page server-rendered (SSR) — no client-side loading spinner
- Directory pages client-rendered for interactive filtering
- `next/image` for all photos with proper sizing hints
- Vercel Analytics + Speed Insights monitoring

### 3.2 SEO
- `generateMetadata()` on every page (title, description, OG tags)
- JSON-LD structured data: `LocalBusiness` + `BreadcrumbList` on restaurant detail pages
- Auto-generated sitemap.xml from live Supabase data
- robots.txt disallowing admin, dashboard, auth paths
- `noindex` on all private pages (dashboard, admin, auth, notifications)
- Slug-based URLs for all restaurants and influencers

### 3.3 Security
- Supabase Row Level Security on every table
- Never trust browser-sent roles — always verify from DB in middleware
- Rate limiting: 10/min sign-in, 5/min sign-up, 3/min forgot-password
- Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- HTTPS enforced on all routes (Vercel)
- Service role key used server-side only, never exposed to client

### 3.4 Accessibility
- WCAG 2.2 AA compliance
- `aria-*` labels on all interactive elements
- `focus-visible` on all focusable elements
- Skip-to-content link
- Semantic HTML: `<nav>`, `<main>`, `<article>`, `<section>`, `<time>`, `<fieldset>`
- All images have `alt` text

### 3.5 Internationalisation
- All prices in Indian Rupees (₹)
- Dates in Indian format (dd Mon yyyy)
- All data seeded for Bengaluru, Karnataka

---

## 4. Data Requirements

### 4.1 Database (Supabase PostgreSQL — 24 tables)
| Table | Purpose |
|---|---|
| zones | Bengaluru food neighbourhoods |
| restaurants | Core listing table |
| dishes | Trending dishes |
| restaurant_dishes | Many-to-many: restaurants ↔ dishes |
| influencers | Food creators |
| influencer_pricing_tiers | Package pricing per influencer |
| influencer_restaurant_posts | Influencer content about restaurants |
| deals | Restaurant exclusive deals |
| reviews | Customer reviews |
| connection_requests | Restaurant → influencer connection requests |
| activity_feed | Live platform activity |
| notifications | Per-user notification records |
| profiles | User profiles (auto-created on signup) |
| user_roles | Explicit role assignments |
| categories | Cuisine categories |
| restaurant_categories | Many-to-many: restaurants ↔ categories |
| locations | Sub-area neighbourhood pages |
| listing_images | Restaurant photos (Supabase Storage) |
| saved_listings | User bookmarks |
| listing_claims | Ownership claim requests |
| enquiries | Contact form submissions |
| review_reports | Review flags for moderation |
| onboarding_progress | Owner setup step tracking |
| audit_logs | Immutable admin action history |

### 4.2 Restaurant Listing Lifecycle
```
draft → pending_review → approved → rejected
                      ↓
                  suspended → archived
```

### 4.3 Supabase Storage
- Bucket: `listing-images` (public)
- File types: JPG, PNG, WebP
- Max file size: 10MB
- 2 images per restaurant in seed data (Unsplash URLs)

### 4.4 Sample Data (seed.sql)
- 8 zones, 8 categories, 8 locations
- 16 restaurants (2 per category)
- 32 listing images (Unsplash food photos)
- 8 influencers with full profiles
- 16 pricing tiers
- 8 influencer posts
- 6 active deals
- 17 reviews
- 12 dishes
- 10 activity feed items

---

## 5. API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/enquiry` | POST | Submit enquiry + fire emails to owner + sender |
| `/api/connect` | POST | Submit influencer connection request |
| `/api/auth/welcome` | POST | Fire welcome / listing-submitted email |
| `/api/admin/listing-status` | POST | Approve/reject listing + fire email + audit log |
| `/auth/callback` | GET | OAuth code exchange + welcome email trigger |
| `/sitemap.xml` | GET | Auto-generated from Supabase |
| `/robots.txt` | GET | Disallow private paths |

---

## 6. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript |
| Styling | Inline CSS with CSS custom properties (no external CSS framework) |
| Icons | Tabler Icons (webfont) |
| Fonts | DM Sans + Playfair Display (next/font) |
| Backend / DB | Supabase PostgreSQL |
| Auth | Supabase Auth (email/password, Google OAuth, magic link) |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime (activity feed) |
| Email | Resend |
| Hosting | Vercel |
| Analytics | @vercel/analytics + @vercel/speed-insights |
| Testing | Playwright (E2E) |

---

## 7. Design System

| Token | Value | Usage |
|---|---|---|
| Copper / Primary | `#E85D26` | CTAs, AI scores, active states |
| Gold | `#F5A623` | Highlights, trends, accents |
| Green | `#2E9E55` | Rising status, success, verified |
| Amber | `#D4860A` | Warning, pending, deal timers |
| Purple | `#7F77DD` | Influencer sections, premium |
| Slate | `#1a1a1a` | Body text, dark hero |
| Border | `#ede8e2` | Card borders, dividers |

**Typography**: DM Sans (body, UI) + Playfair Display (hero headings)
**Border radius**: 14–20px for cards, 20–40px for pills/buttons
**Hero gradient**: `linear-gradient(150deg, #1a0a00, #2d1200, #1a0800)`

---

## 8. Browser & Device Support
- Chrome 120+, Safari 17+, Firefox 121+, Edge 120+
- Mobile: iOS 16+, Android 12+
- Responsive: works on all screen sizes
- Minimum viewport: 320px

---

## 9. Deployment

### 9.1 Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server-side only
RESEND_API_KEY=                  # transactional email
EMAIL_FROM=                      # e.g. hello@foodculture.ai
NEXT_PUBLIC_APP_URL=             # e.g. https://foodculture.ai
```

### 9.2 Deployment Steps
1. Push to GitHub
2. Import to Vercel
3. Add all environment variables
4. Run SQL in Supabase: schema.sql → migration_002.sql → seed.sql
5. Create Supabase Storage bucket `listing-images` (public)
6. Configure Supabase Auth: site URL, redirect URLs, Google OAuth
7. Deploy

---

## 10. Out of Scope (Future)

| Feature | Notes |
|---|---|
| Semantic AI search | Claude Haiku + pgvector embeddings |
| Multi-city support | City switcher cookie |
| Payment processing | Influencer booking fees |
| Mobile app | React Native / Expo |
| Real-time chat | Supabase Realtime messaging |
| Review photos | Image upload on reviews |
| Restaurant analytics export | CSV download |
