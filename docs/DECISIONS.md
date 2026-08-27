# DECISIONS.md — FoodCulture AI

Key decisions made during the build, and the reasoning behind each one.

---

## Architecture

### Next.js 14 App Router (not Pages Router)
**Decision**: Use App Router with React Server Components.
**Reason**: Server Components allow data-fetching at the route level without client-side waterfalls. Homepage and trending page fetch at request time — no loading spinners, better Core Web Vitals. Client components used for interactive pages (directory, explore, dashboard) where filters and state are needed.

### Supabase (not MySQL / Prisma / PlanetScale)
**Decision**: Supabase PostgreSQL over the MySQL referenced in the original brief.
**Reason**: Supabase provides Auth, Storage, Realtime, and PostgreSQL in one managed service. No separate auth service needed. RLS policies enforce data access at the database layer — not just in application code. PostgreSQL supports `text[]` arrays (cuisine_tags), `jsonb` (metadata in audit_logs), and `uuid_generate_v4()` natively.
**Note**: The doc referenced MySQL. We adapted all schema to PostgreSQL. The equivalent MySQL types are: `TEXT[]` → `JSON`, `uuid` → `CHAR(36)`, `timestamptz` → `DATETIME`, `uuid_generate_v4()` → application-generated UUID.

### Supabase Auth (not NextAuth / Clerk)
**Decision**: Supabase Auth for all authentication.
**Reason**: Natively integrated with Supabase RLS — session user is automatically available inside database policies. Supports email/password and Google OAuth out of the box. No additional library needed.

---

## Data model

### Slug-based URLs (not UUID-based)
**Decision**: `/restaurants/dum-biryani-house` not `/restaurants/abc123-def456`
**Reason**: SEO. Search engines index URL structure. Slugs make URLs human-readable and shareable. Slugs generated from restaurant/influencer name + timestamp suffix for uniqueness.

### Listing status lifecycle (not a simple published boolean)
**Decision**: `draft → pending_review → approved → rejected → suspended → archived`
**Reason**: A boolean is insufficient for a marketplace. Owners need a draft state before submitting. Admins need to approve before public visibility. Rejected listings need a reason field. Suspended listings may return.

### cuisine_tags as text[] (not a separate tags table)
**Decision**: Store cuisine tags as a PostgreSQL text array directly on the restaurant row.
**Reason**: Cuisine tags are read-only filter criteria, not relational entities. A separate tags table + join table adds complexity with no benefit. PostgreSQL's `@>` contains operator queries arrays efficiently.

### intelligence_score as a computed integer (not a formula column)
**Decision**: Store the score as an integer, updated periodically.
**Reason**: Computing a composite score on every query read is expensive. Storing it allows sorting and filtering in a single index scan. Score is updated by a background job (future) or manually seeded.

### Connection fee model
**Decision**: Restaurants pay a one-time connection fee to be introduced to an influencer.
**Reason**: This separates discovery (free) from connection (paid). Influencers are not charged. The fee model is simpler than a commission-on-results model and easier to implement in V1.

---

## Security

### RLS at the database layer (not just middleware)
**Decision**: Every table has Row Level Security policies.
**Reason**: Application-level authorization is a single point of failure. If middleware is bypassed or a server action has a bug, RLS ensures the database itself enforces access rules. Defence in depth.

### Never trust browser-sent roles
**Decision**: Always read `profiles.role` from the database in middleware, never from a cookie or client claim.
**Reason**: Any user can forge a cookie or send a custom header claiming to be an admin. The middleware calls Supabase to verify the role from the database before granting access to `/admin`.

### Rate limiting in middleware (not API routes)
**Decision**: Rate limiting runs in Next.js middleware before the route is executed.
**Reason**: Limits apply to all matching routes regardless of implementation. Current implementation uses in-memory state (resets on cold start) — suitable for development and low-traffic production. For high-traffic: replace with Upstash Redis.

---

## UI / UX

### Emoji as placeholder images
**Decision**: Use emoji instead of placeholder image services for restaurant/influencer avatars in V1.
**Reason**: Placeholder services have rate limits and add external dependencies. Emoji render consistently across devices. Real images are supported via Supabase Storage (listing_images table + ImageUploader component) — emoji are the fallback.

### No follower count bias in ranking
**Decision**: Influencers ranked by `impact_score` (visit conversion rate), not `followers_count`.
**Reason**: Core product differentiator. A creator with 20K followers who drives 200 restaurant visits per week outperforms one with 200K followers who drives 10.

### Inline modal for connect CTA (not a separate page)
**Decision**: Connection request form opens as an overlay on the influencer profile page.
**Reason**: Reduces friction. The user stays in context rather than navigating away and losing their place in the influencer list.

---

## SEO

### generateMetadata() per page (not global only)
**Decision**: Dynamic metadata on restaurant and influencer detail pages, static metadata on directory pages.
**Reason**: Each restaurant and influencer detail page needs a unique title, description, and canonical URL for SEO. The layout.tsx provides fallback global metadata.

### JSON-LD on restaurant detail pages only
**Decision**: LocalBusiness structured data on restaurant detail pages; BreadcrumbList on same.
**Reason**: These are the pages that appear in Google local search results. Homepage and directory pages don't have the specific structured data that Google uses for rich snippets.

### noindex on auth, dashboard, and admin pages
**Decision**: Private pages are excluded from search indexing.
**Reason**: These pages have no SEO value and should not appear in search results. robots.ts disallows the paths at crawl level; generateMetadata with `robots: noindex` is a belt-and-suspenders fallback.
