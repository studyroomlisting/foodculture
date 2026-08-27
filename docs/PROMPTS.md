# FoodCulture AI — Build Prompts & Developer Reference
**All prompts used to build this project with Claude**

---

## Phase 1 — Project Setup & Architecture

**Prompt 1 — Initial brief**
```
Build FoodCulture AI: a food intelligence and influencer marketplace platform for Bengaluru, India.
Stack: Next.js 14 App Router + TypeScript + Supabase + Vercel.
Three user types: visitor, restaurant owner, admin.
Core differentiator: rank influencers by visit conversion rate, not follower count.
Prices hidden behind "unlock to connect" modal.
```

**Prompt 2 — Database schema**
```
Design a 24-table PostgreSQL schema for FoodCulture AI covering:
zones, restaurants, dishes, influencers, deals, reviews, connection_requests,
activity_feed, notifications, profiles, categories, locations, listing_images,
saved_listings, listing_claims, enquiries, review_reports, onboarding_progress, audit_logs.
Include RLS policies, indexes, foreign keys, and the handle_new_user() trigger.
Restaurant listing lifecycle: draft → pending_review → approved → rejected → suspended → archived.
```

**Prompt 3 — Design system**
```
Design system using:
- Copper #E85D26 (primary CTA, AI scores)
- Gold #F5A623 (highlights, trends)
- Green #2E9E55 (rising status, success)
- Amber #D4860A (pending, warning)
- Purple #7F77DD (influencer sections)
- Dark hero gradient: linear-gradient(150deg,#1a0a00,#2d1200,#1a0800)
- Tabler Icons webfont
- DM Sans + Playfair Display fonts
- Border radius 14–20px cards, 20–40px pills
- Animations: blink, pulse, slideUp, floatup, ticker
```

---

## Phase 2 — Frontend Pages

**Prompt 4 — Homepage**
```
Build HomePageLive component with:
- Live ticker bar with scrolling platform activity
- Dark hero with floating food emojis, AI search bar, chip filters
- Stats row (restaurants tracked, reviews analysed, influencers scored)
- Trending restaurants grid (3 cols) with RestaurantCard
- Trending dishes grid (4 cols) with gradient cards
- Top influencers row (3 cols) with InfluencerCard
- Zone heat map (4 zones with trend scores and colour-coded bars)
- Live activity feed with real-time Supabase subscription
- Footer CTA + footer bottom bar with all links
```

**Prompt 5 — Restaurant directory**
```
Build RestaurantDirectoryLive with:
- Dark page header with stats (total restaurants, categories, zones)
- Sticky filter bar: category chips, zone chips, price tier, sort dropdown
- Responsive 3-col restaurant card grid using RestaurantCard component
- Each card: image/emoji, status badge (Viral/Rising/New), name, area, cuisine tags,
  rating with review count, AI score with progress bar, Book now + Save buttons
- Load more pagination (12 per page)
- URL-synced search (?q= param)
```

**Prompt 6 — Restaurant detail page**
```
Build RestaurantDetailLive with:
- Dark hero: back button, emoji/image, name, area, price, open status, cuisine tags, AI score
- Image strip: horizontal scrollable gallery from listing_images
- Tab navigation: Overview | Reviews | Deals | Influencers | Contact
- Overview tab: AI brief box, key metrics, influencer coverage rows
- Reviews tab: star rating UI, review submit form, review list with verified badges
- Deals tab: deal box with code, one-click copy, claim button
- Influencers tab: post rows with views/visits stats
- Contact tab: enquiry form (name, email, phone, message)
- Sidebar: map placeholder, opening hours, active deal card
- Action bar: Book table CTA, View deal CTA, Save heart button
- JSON-LD LocalBusiness + BreadcrumbList structured data
```

**Prompt 7 — Booking page**
```
Build booking page at /restaurants/[id] as modal-style page:
- Restaurant header (emoji, name, location)
- Date picker (date input)
- Party size dropdown
- Time slot grid (8 slots, some unavailable)
- Name + phone fields
- Special requests textarea
- Price breakdown: reservation (free), deal applied, estimated spend, after-discount total
- Confirm reservation button
- Free cancellation notice
```

**Prompt 8 — Influencer directory**
```
Build InfluencerDirectoryLive with:
- Dark page header with stats (creators, total reach, weekly visits driven)
- Sticky filter bar: platform (All/Instagram/YouTube/Both), niche tags, sort
- Top 3 featured creators in larger cards with rank medals
- Remaining creators in 3-col grid using InfluencerCard
- Each card: avatar with initials, name, handle + followers, platform badge,
  3 KPIs (impact%, visits/week, connection fee), cuisine tags, Connect CTA
- Pagination (12 per page)
```

**Prompt 9 — Influencer profile**
```
Build InfluencerProfileLive with:
- Dark hero: avatar circle with initials, name, handle, followers, platform, impact score
- Lock CTA: "Unlock to connect — from ₹X,000" (sign-in required)
- About section with full bio
- Performance metrics table (impact score, trust score, engagement rate, weekly visits)
- Recent posts with restaurant links, view counts, visits driven
- Pricing packages sidebar (2 tiers per influencer)
- Audience breakdown (age, city, gender, cuisine interest)
- Connection form: restaurant name, contact name, collab interest
```

**Prompt 10 — Explore page**
```
Build ExplorePageLive with:
- Dark hero with AI search bar, chip shortcuts
- Tab bar: Restaurants | Influencers | Zones
- URL-synced search: /explore?q=Biryani updates input and filters results
- Restaurants tab: 3-col grid with RestaurantCard, load more
- Influencers tab: 3-col grid with InfluencerCard, load more
- Zones tab: zone cards with trend score bars
```

**Prompt 11 — Trending page**
```
Build TrendingPageLive with:
- Dark header (Live badge, last updated time)
- Trending dishes: 4-col gradient cards with dish emoji, name, trend label
- Hottest zones: 4 zone cards with trend scores and week-on-week change
- Creator leaderboard: ranked list with avatar, views, visits driven
```

**Prompt 12 — Deals page**
```
Build DealsPage with:
- Dark header with active deal count
- 3-col deals grid
- Each deal card: gradient background (orange/green/purple per theme),
  restaurant name + emoji, deal title, description, savings label,
  promo code (monospace), one-click copy button, expiry countdown
```

---

## Phase 3 — Auth Pages

**Prompt 13 — Sign in / Sign up**
```
Build auth pages with dark gradient background:
- Sign in: Google OAuth button, email/password form, forgot password link
- Sign up: role picker (Visitor vs Restaurant Owner cards), Google OAuth, email/password form
- Shared: logo ball with pulse animation, tab switcher between Sign in / Create account
- Forgot password: email field, send reset link button, back to sign in link
```

---

## Phase 4 — Dashboard & Account

**Prompt 14 — Owner dashboard**
```
Build DashboardLive with sidebar layout (220px sidebar + main):
Sidebar: listing switcher (emoji + name + status), nav sections (Overview, Manage, Account),
nav items with icons (Dashboard, Analytics, Influencers, My listings, Enquiries with badge,
Deals, Bookings, Profile, Security, Notifications, Sign out)

Main area:
- Welcome greeting with owner name and current restaurant
- Quick actions bar: Add listing, Enquiries, Saved, Find influencers
- KPI row (4 cards): AI Intelligence Score, Visits from influencers, Profile views, Avg rating
- Weekly visits bar chart (7 bars Mon–Sun)
- Recent enquiries panel with reply button
- Latest influencer posts panel with view counts + visits driven
- My listings panel with status pills (Live/Pending/Draft) + Edit buttons
```

**Prompt 15 — Enquiry inbox**
```
Build EnquiriesPage (owner view) with:
- Sidebar: filter by status (All, New, Replied, Spam) with counts
- Enquiry cards: sender avatar (initial), name, email, phone, message,
  timestamp, status badge
- Actions per enquiry: Reply (opens mailto with pre-filled text + marks replied in DB),
  Mark read, Mark spam
- Multi-restaurant switcher if owner has multiple listings
- Bulk mark-all-read
```

**Prompt 16 — Account / Profile**
```
Build account page with left profile card + right settings area:
Profile card:
- Cover gradient, avatar with initials, name, email, role badge
- Stats (listings, enquiries, avg AI score)
- Left navigation: Profile, Booking history, Saved listings, Notifications, Security, Sign out

Settings area:
- Personal information form (name, email, phone, city)
- Notification preferences (toggles: influencer posts, enquiries, AI scores, deals, marketing)
- Danger zone: delete account button
```

**Prompt 17 — Booking history**
```
Build history page with:
- Same left profile sidebar as account page
- History list: icon (restaurant emoji), restaurant name, area + party size + time,
  amount paid, date, status pill (Confirmed/Pending/Cancelled)
```

**Prompt 18 — Security page**
```
Build security page with:
- Password change row
- 2FA setup row
- Connected accounts (Google - Connected)
- Active sessions row with "Sign out all devices" button
- Login history table (device, location, timestamp, block suspicious)
```

**Prompt 19 — Notifications page**
```
Build notifications page with:
- Unread count badge
- All / Unread filter tabs
- Mark all read button
- Notification items: icon, title, body, timestamp, action button
- Types: Viral alert (coral), Score update (green), New enquiry (amber), Influencer match (purple), Review (grey)
- On click: mark as read in Supabase notifications table + update UI
```

---

## Phase 5 — Admin

**Prompt 20 — Admin dashboard**
```
Build AdminDashboard with 7 tabs:
- Listings: restaurant rows, approve/reject/suspend with confirm modal, listing status pills
- Users: profile rows with role, onboarding status, creation date
- Reviews: review rows with rating, body excerpt, delete button
- Enquiries: read-only view of all platform enquiries with status
- Claims: listing claim requests with evidence notes, approve (assigns owner_id) / reject buttons
- Audit: immutable audit log table (action, actor, target, timestamp)
- All actions write to audit_logs table
- All approve/reject → fires email via /api/admin/listing-status
```

---

## Phase 6 — Backend / Infrastructure

**Prompt 21 — API routes**
```
Build 4 API routes:
1. POST /api/enquiry — validate fields, insert to enquiries table, send owner notification email + sender confirmation email via Resend
2. POST /api/connect — insert connection_request, send connection email to influencer
3. POST /api/auth/welcome — fire welcome email or listing-submitted email (called from auth callback + onboarding)
4. POST /api/admin/listing-status — verify admin role, update restaurant.listing_status, write audit_log, send approval/rejection email to owner (requires SUPABASE_SERVICE_ROLE_KEY)
```

**Prompt 22 — Middleware**
```
Build Next.js middleware with:
- Route protection: /dashboard → require auth, /admin → require admin role
- Rate limiting: 10/min /auth/signin, 5/min /auth/signup, 3/min /auth/forgot-password
- Security headers: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin
- Reads role from Supabase profiles table (never from cookie/header)
```

**Prompt 23 — Email templates (Resend)**
```
Build 7 transactional email functions in lib/email.ts:
1. sendWelcomeEmail — triggered on first signup via /auth/callback
2. sendListingSubmittedEmail — triggered on onboarding Step 4
3. sendListingApprovedEmail — triggered by admin action
4. sendListingRejectedEmail — triggered by admin action with rejection reason
5. sendNewEnquiryEmail — to restaurant owner on new enquiry
6. sendEnquiryConfirmationEmail — to enquiry sender
7. sendConnectionRequestEmail — to influencer on connection request

All emails: base HTML layout with dark header, copper primary, clean typography.
Gracefully skip if RESEND_API_KEY not set (logs to console).
```

**Prompt 24 — Seed data**
```
Write comprehensive seed.sql for Bengaluru with:
- 8 zones (Koramangala, Indiranagar, HSR, JP Nagar, Whitefield, Marathahalli, Jayanagar, MG Road)
- 8 categories (Biryani, South Indian, Street Food, Burgers, Seafood, Cafes, Fine Dining, Desserts)
- 8 locations (named sub-areas within zones)
- 16 restaurants (2 per category) with full AI briefs, realistic ratings and intelligence scores
- 32 listing images using real Unsplash food photo URLs
- 19 restaurant-category assignments (some cross-listed)
- 8 influencers with full bios, impact scores, pricing tiers (16 total)
- 8 influencer posts with realistic view counts and visits driven
- 6 active deals with promo codes and expiry dates
- 17 customer reviews across all restaurants
- 12 trending dishes
- 10 activity feed items
Use ON CONFLICT DO NOTHING on all inserts for idempotency.
```

---

## Phase 7 — Documentation

**Prompt 25 — Database documentation**
```
Build complete 05-database/ folder with:
- README.md: setup guide, run order, Storage bucket setup, Auth config, dev commands
- RUN_ORDER.md: exact SQL file sequence with verification queries per step
- DATABASE_SCHEMA.md: every table, every column, type, nullable, default, constraints, indexes, RLS
- FORM_TO_DATABASE_MAPPING.md: every form → every field → table → column → constraints → RLS
- ERD.md: full entity relationship diagram, relationship types, RLS access matrix, listing lifecycle
- TABLES/: 24 individual table .md files
- verification/: 7 SQL files for post-setup verification
- rollback/: safe rollback SQL per migration
- seeds/: seed data reference docs
```

**Prompt 26 — UI Mockups**
```
Build comprehensive single-file HTML mockup (foodculture-all-pages.html) with JavaScript page navigation covering all pages:
- Home, Restaurant directory, Restaurant detail (5 tabs), Booking
- Influencer directory, Influencer profile
- Deals, Trending, Explore
- Dashboard (owner), Enquiry inbox, Admin
- Account/Profile, Booking history, Notifications, Security
- Sign in, Sign up, Forgot password

Use exact design system from reference templates:
- CSS variables: --o:#E85D26 --g:#2E9E55 --pu:#7F77DD --gd:#D4860A
- Dark hero gradient: linear-gradient(150deg,#1a0a00,#2d1200,#1a0800)
- Animations: blink, pulse, floatup, slideUp, ticker
- Tabler Icons webfont
- Navigation: sticky nav with gradient active tabs, pulse logo ball, notification bell
```

---

## Phase 8 — Fixes & Polish

**Prompt 27 — TypeScript fixes**
```
Fix all structural TypeScript errors:
- seo.ts → seo.tsx (JSX in .ts not allowed)
- Move Breadcrumbs component to components/Breadcrumbs.tsx
- Fix InfluencerDirectoryLive filter/pagination variable scope
- Fix getDashboardStats reduce type errors
- Fix all server/client page splits (page.tsx + client.tsx pattern)
- Cast all supabase.from() as any to suppress untyped Supabase inference errors
- Add noindex metadata to all private pages
```

**Prompt 28 — Images**
```
Wire Unsplash images throughout frontend:
- Update queries.ts to join listing_images on all restaurant queries
- Update RestaurantCard to show next/image with emoji fallback
- Update InfluencerCard with avatar initials and colour palette
- Update RestaurantDetailLive to show image strip gallery + hero thumbnail
- Update next.config.js to allow images.unsplash.com domain
- Update ExplorePageLive, CategoryPage, LocationPage to use shared card components
```

**Prompt 29 — Final audit & packaging**
```
Final pre-handoff audit:
- Run npx tsc --noEmit and fix all structural errors to zero
- Verify 0 SELECT * in queries.ts
- Verify all 38 routes have correct server/client split
- Verify Nav has all links, Footer has all links, Dashboard has quick actions
- Verify AdminDashboard has all 7 tabs including Claims
- Package into zip excluding node_modules, .next, *.tsbuildinfo
```

---

## Useful Commands

```bash
# Install
npm install

# Development
npm run dev

# Type check (should show 0 structural errors)
npm run typecheck

# E2E tests
npm test

# Build for production
npm run build

# Database setup (run in Supabase SQL Editor, in order)
# 1. supabase/schema.sql
# 2. supabase/migration_002.sql
# 3. supabase/seed.sql  (dev/staging only)
```

---

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Required for admin email notifications
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Required for transactional emails
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=FoodCulture AI <hello@foodculture.ai>

# App URL
NEXT_PUBLIC_APP_URL=https://foodculture.ai
```
