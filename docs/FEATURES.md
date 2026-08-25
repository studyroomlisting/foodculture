# FEATURES.md — FoodCulture AI

Complete inventory of every feature, its status, and where it lives in the codebase.

---

## Public features (no login required)

| Feature | Status | Route | Component | DB tables |
|---|---|---|---|---|
| Homepage with trending feed | ✅ Live | `/` | `HomePageLive` | restaurants, dishes, influencers, zones, activity_feed |
| Live activity feed (realtime) | ✅ Live | `/` | `RealtimeFeed` | activity_feed (realtime subscription) |
| Restaurant directory | ✅ Live | `/restaurants` | `RestaurantDirectoryLive` | restaurants, zones |
| Restaurant search | ✅ Live | `/restaurants`, `/explore` | — | client-side filter |
| Restaurant filter by zone | ✅ Live | `/restaurants` | — | zones |
| Restaurant filter by status | ✅ Live | `/restaurants` | — | restaurants.status |
| Restaurant detail page | ✅ Live | `/restaurants/[slug]` | `RestaurantDetailLive` | restaurants, reviews, deals, influencer_restaurant_posts |
| Reviews (read) | ✅ Live | `/restaurants/[slug]` | — | reviews |
| Deals display + copy code | ✅ Live | `/restaurants/[slug]`, `/deals` | — | deals |
| Influencer directory | ✅ Live | `/influencers` | `InfluencerDirectoryLive` | influencers |
| Influencer profile | ✅ Live | `/influencers/[slug]` | `InfluencerProfileLive` | influencers, influencer_pricing_tiers, influencer_restaurant_posts |
| Trending page | ✅ Live | `/trending` | `TrendingPageLive` | dishes, zones, restaurants, influencers |
| Explore / search | ✅ Live | `/explore` | `ExplorePageLive` | restaurants, influencers, zones |
| Deals page | ✅ Live | `/deals` | `DealsPage` | deals, restaurants |
| Category pages | ✅ Live | `/categories/[slug]` | `CategoryPage` | categories, restaurant_categories, restaurants |
| Location / neighbourhood pages | ✅ Live | `/locations/[slug]` | `LocationPage` | locations, zones, restaurants |
| 404 page | ✅ Live | `not-found.tsx` | — | — |
| Sitemap.xml | ✅ Live | `/sitemap.xml` | `sitemap.ts` | restaurants, influencers, categories, locations |
| robots.txt | ✅ Live | `/robots.txt` | `robots.ts` | — |

---

## Auth features

| Feature | Status | Route | Component | Notes |
|---|---|---|---|---|
| Email + password sign up | ✅ Live | `/auth/signup` | `SignUpPage` | Role picker: visitor / owner |
| Google OAuth sign up | ✅ Live | `/auth/signup` | `SignUpPage` | — |
| Email + password sign in | ✅ Live | `/auth/signin` | `SignInPage` | — |
| Google OAuth sign in | ✅ Live | `/auth/signin` | `SignInPage` | — |
| Magic link sign in | ✅ Live | `/auth/signin` | `SignInPage` | — |
| Forgot password / reset | ✅ Live | `/auth/forgot-password` | `ForgotPasswordPage` | Supabase reset email |
| OAuth callback handler | ✅ Live | `/auth/callback` | `route.ts` | Code exchange |
| Auto profile creation | ✅ Live | — | DB trigger | `handle_new_user()` |
| Sign out | ✅ Live | Nav dropdown | `Nav` | `supabase.auth.signOut()` |

---

## User (visitor) features

| Feature | Status | Route | Component | DB tables |
|---|---|---|---|---|
| Save / bookmark restaurant | ✅ Live | `/restaurants/[slug]` | `RestaurantDetailLive` | saved_listings |
| View saved restaurants | ✅ Live | `/dashboard/saved` | `SavedListingsPage` | saved_listings, restaurants |
| Submit enquiry form | ✅ Live | `/restaurants/[slug]` | `RestaurantDetailLive` | enquiries |
| Write a review | ✅ Live | `/restaurants/[slug]` | `RestaurantDetailLive` | reviews |
| Connect with influencer | ✅ Live | `/influencers/[slug]` | `InfluencerProfileLive` | connection_requests |
| Notifications centre | ✅ Live | `/notifications` | `NotificationsPage` | activity_feed |
| Mark notifications read | ✅ Live | `/notifications` | — | No DB write yet |

---

## Restaurant owner features

| Feature | Status | Route | Component | DB tables |
|---|---|---|---|---|
| Onboarding wizard (4 steps) | ✅ Live | `/onboarding` | `OnboardingPage` | profiles, restaurants, onboarding_progress |
| Owner dashboard | ✅ Live | `/dashboard` | `DashboardLive` | restaurants, influencer_restaurant_posts |
| Create listing | ✅ Live | `/dashboard/listings/new` | `ListingFormPage` | restaurants |
| Edit listing | ✅ Live | `/dashboard/listings/[id]/edit` | `ListingFormPage` | restaurants |
| Upload photos | ✅ Live | Listing form + Onboarding | `ImageUploader` | listing_images, Supabase Storage |
| Submit listing for review | ✅ Live | Onboarding Step 4 | `OnboardingPage` | restaurants.listing_status |
| View saved listings | ✅ Live | `/dashboard/saved` | `SavedListingsPage` | saved_listings |
| Claim unclaimed listing | ✅ Live | `/restaurants/[slug]/claim` | `ClaimListingPage` | listing_claims |
| View enquiries | ✅ Live | `/admin/enquiries` + `/dashboard/enquiries` | `AdminDashboard`, `EnquiriesPage` | enquiries |
| Respond to enquiries | ✅ Live | — | — | enquiries.status, enquiries.replied_at |
| Transactional emails | ✅ Live | — | — | Needs Resend integration |

---

## Admin features

| Feature | Status | Route | Component | DB tables |
|---|---|---|---|---|
| Admin dashboard | ✅ Live | `/admin` | `AdminDashboard` | all |
| Listings management | ✅ Live | `/admin/listings` | `AdminDashboard` | restaurants |
| Approve listing | ✅ Live | `/admin` | — | restaurants.listing_status, audit_logs |
| Reject listing | ✅ Live | `/admin` | — | restaurants.listing_status, audit_logs |
| Suspend listing | ✅ Live | `/admin` | — | restaurants.listing_status, audit_logs |
| User management | ✅ Live | `/admin/users` | `AdminDashboard` | profiles |
| Review moderation | ✅ Live | `/admin/reviews` | `AdminDashboard` | reviews, audit_logs |
| Enquiry inbox | ✅ Live | `/admin/enquiries` | `AdminDashboard` | enquiries |
| Audit log | ✅ Live | `/admin/audit` | `AdminDashboard` | audit_logs |
| Claim request review | ✅ Live | `/admin/claims` | `AdminDashboard` (claims tab) | listing_claims |

---

## Platform / technical features

| Feature | Status | Notes |
|---|---|---|
| Server Components (SSR) | ✅ Live | Homepage, trending — fetched at request time |
| Client Components | ✅ Live | All interactive pages (directory, explore, dashboard) |
| Route protection middleware | ✅ Live | dashboard, admin, onboarding → login redirect |
| Rate limiting | ✅ Live | Auth endpoints + form endpoints |
| Security headers | ✅ Live | X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| SEO metadata per page | ✅ Live | generateMetadata() on all routes |
| JSON-LD structured data | ✅ Live | LocalBusiness + BreadcrumbList on restaurant detail |
| Sitemap | ✅ Live | Auto-generated from Supabase live data |
| robots.txt | ✅ Live | Disallows admin/dashboard/auth |
| noindex on private pages | ✅ Live | dashboard, admin, auth, notifications |
| Breadcrumb navigation | ✅ Live | Restaurant detail page |
| Pagination (load more) | ✅ Live | Restaurant directory, explore, influencer directory |
| URL-synced search params | ✅ Live | `/explore?q=` synced with input |
| Realtime feed | ✅ Live | `supabase.channel()` on activity_feed |
| Image upload (Storage) | ✅ Live | Drag-drop, type/size validation, Supabase Storage |
| next/font | ✅ Live | DM Sans + Playfair Display |
| next/image config | ✅ Live | Supabase + Google domains configured |
| Accessibility (WCAG 2.2 AA) | ✅ Live | aria-*, focus-visible, skip-nav, semantic HTML |
| CLAUDE.md | ✅ Live | Project memory for Claude Code |

---

## Email flows — fully wired

| Flow | Trigger | Template |
|---|---|---|
| Welcome | New signup via OAuth callback | `sendWelcomeEmail()` |
| Listing submitted | Onboarding Step 4 | `sendListingSubmittedEmail()` |
| Listing approved | Admin approves via `/api/admin/listing-status` | `sendListingApprovedEmail()` |
| Listing rejected | Admin rejects via `/api/admin/listing-status` | `sendListingRejectedEmail()` |
| Enquiry to owner | Visitor submits enquiry form | `sendNewEnquiryEmail()` |
| Enquiry confirmation | Visitor submits enquiry form | `sendEnquiryConfirmationEmail()` |
| Connection request | Visitor connects with influencer | `sendConnectionRequestEmail()` |

All emails require `RESEND_API_KEY` in `.env.local`. Approval/rejection emails also require `SUPABASE_SERVICE_ROLE_KEY`.

## Pending / future roadmap

| Feature | Priority | Notes |
|---|---|---|
| Transactional emails | ✅ DONE | Resend or Supabase Edge Functions — welcome, approval, enquiry confirmation |
| Owner enquiry reply | ✅ DONE | Email reply flow from dashboard |
| Claim request review in admin | ✅ DONE | UI to approve/reject listing claims |
| Mark notification read (DB) | ✅ DONE | Write to notifications table, not just UI state |
| Playwright E2E tests | ✅ DONE | Cover auth flow, listing creation, admin actions |
| Semantic AI search | LOW — future sprint | Claude Haiku + pgvector embeddings — scaffolded, needs Voyage AI key |
| Account deletion | ✅ DONE | GDPR: delete profile, anonymise reviews |
| Cookie consent | ✅ DONE | Banner + preference storage |
| Terms of Service / Privacy Policy | ✅ DONE | Static pages |
| Multi-city support | LOW — future sprint | City switcher cookie, filter queries by city |
| Performance monitoring | ✅ DONE | @vercel/analytics + @vercel/speed-insights added to layout |
