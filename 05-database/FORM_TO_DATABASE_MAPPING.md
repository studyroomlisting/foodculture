# FORM_TO_DATABASE_MAPPING.md — FoodCulture AI

Every form in the project, every field, and exactly where the data goes in the database.

---

## 1. Sign Up Form
**Route**: `/auth/signup`
**Component**: `components/auth/SignUpPage.tsx`
**Supabase operation**: `supabase.auth.signUp()` + auto-trigger creates `profiles` row

| Field | Type | Table | Column | Notes |
|---|---|---|---|---|
| Full name | text | `profiles` | `full_name` | Passed via `raw_user_meta_data` → trigger reads it |
| Email | email | `auth.users` | `email` | Supabase Auth manages this |
| Password | password | `auth.users` | (hashed) | Supabase Auth manages — never stored in plain text |
| Role (visitor/owner) | enum | `profiles` | `role` | Passed via `raw_user_meta_data.role` |

**Trigger**: `handle_new_user()` fires on `auth.users` INSERT — auto-creates `profiles` row

**Validation**:
- Email: valid format required
- Password: minimum 8 characters
- Role: one of `visitor | owner`

---

## 2. Sign In Form
**Route**: `/auth/signin`
**Component**: `components/auth/SignInPage.tsx`
**Supabase operation**: `supabase.auth.signInWithPassword()` OR `signInWithOAuth()` OR `signInWithOtp()`

| Field | Type | Table | Column | Notes |
|---|---|---|---|---|
| Email | email | `auth.users` | `email` | Looked up by Supabase Auth |
| Password | password | `auth.users` | (hashed) | Verified by Supabase Auth |

**No DB write** — Supabase Auth handles session management
**Google OAuth**: no additional fields — redirect to `/auth/callback`

---

## 3. Forgot Password Form
**Route**: `/auth/forgot-password`
**Component**: `components/auth/ForgotPasswordPage.tsx`
**Supabase operation**: `supabase.auth.resetPasswordForEmail()`

| Field | Type | Table | Column | Notes |
|---|---|---|---|---|
| Email | email | `auth.users` | `email` | Supabase Auth looks up the user |

**No DB write** — Supabase Auth sends reset email and manages token internally

---

## 4. Onboarding — Step 1: Profile
**Route**: `/onboarding`
**Component**: `components/live/OnboardingPage.tsx` (Step 1)
**Supabase operation**: `supabase.from('profiles').update()`

| Field | Type | Table | Column | Constraints |
|---|---|---|---|---|
| Full name | text | `profiles` | `full_name` | max 255 chars |
| Phone number | text | `profiles` | `phone` | optional, no format enforced |

---

## 5. Onboarding — Step 2: Restaurant Details
**Route**: `/onboarding`
**Component**: `components/live/OnboardingPage.tsx` (Step 2)
**Supabase operations**:
- `supabase.from('restaurants').insert()`
- `supabase.from('onboarding_progress').upsert()`

| Field | Type | Table | Column | Constraints |
|---|---|---|---|---|
| Restaurant name | text | `restaurants` | `name` | required, max 255 |
| Area / neighbourhood | text | `restaurants` | `area_label` | required |
| Cuisine types | text (comma-split → array) | `restaurants` | `cuisine_tags` | text[] |
| Price range | enum | `restaurants` | `price_tier` | ₹ \| ₹₹ \| ₹₹₹ \| ₹₹₹₹ |
| Open until | text | `restaurants` | `open_until` | e.g. "11:30 PM" |
| owner_id | uuid (auto) | `restaurants` | `owner_id` | set from `auth.getUser().id` |
| listing_status | enum (auto) | `restaurants` | `listing_status` | set to `'draft'` automatically |
| slug | text (auto) | `restaurants` | `slug` | generated from name + timestamp |

---

## 6. Onboarding — Step 3: Photo Upload
**Route**: `/onboarding`
**Component**: `components/live/OnboardingPage.tsx` (Step 3) → `ImageUploader`
**Supabase operations**:
- `supabase.storage.from('listing-images').upload()`
- `supabase.from('listing_images').insert()`

| Field | Type | Table | Column | Constraints |
|---|---|---|---|---|
| Photo files | File[] | `listing_images` | `storage_path`, `url` | JPG/PNG/WebP, max 10MB |
| restaurant_id | uuid (auto) | `listing_images` | `restaurant_id` | from current listing |
| is_primary | boolean (auto) | `listing_images` | `is_primary` | true for first uploaded image |

---

## 7. Onboarding — Step 4: Submit for Review
**Route**: `/onboarding`
**Component**: `components/live/OnboardingPage.tsx` (Step 4)
**Supabase operations**:
- `supabase.from('restaurants').update()` → `listing_status = 'pending_review'`
- `supabase.from('profiles').update()` → `onboarding_complete = true`
- `supabase.from('onboarding_progress').upsert()`

| Field | Type | Table | Column | Notes |
|---|---|---|---|---|
| listing_status | enum (auto) | `restaurants` | `listing_status` | Set to `pending_review` |
| submitted_at | timestamptz (auto) | `restaurants` | `submitted_at` | `new Date().toISOString()` |
| onboarding_complete | boolean (auto) | `profiles` | `onboarding_complete` | Set to `true` |
| step_listing_submitted | boolean (auto) | `onboarding_progress` | `step_listing_submitted` | Set to `true` |
| completed_at | timestamptz (auto) | `onboarding_progress` | `completed_at` | `new Date().toISOString()` |

---

## 8. Create Listing Form
**Route**: `/dashboard/listings/new`
**Component**: `components/live/ListingFormPage.tsx` (mode="create")
**Supabase operation**: `supabase.from('restaurants').insert()`

| Field | Type | Table | Column | Constraints |
|---|---|---|---|---|
| Restaurant name | text | `restaurants` | `name` | required |
| Emoji icon | text | `restaurants` | `emoji` | single emoji char |
| Area / neighbourhood | text | `restaurants` | `area_label` | required |
| Cuisine types | text (comma-split) | `restaurants` | `cuisine_tags` | text[] |
| Avg spend per person | integer | `restaurants` | `avg_spend` | ₹ amount |
| Open until | text | `restaurants` | `open_until` | e.g. "11 PM" |
| Peak hours | text | `restaurants` | `peak_hours` | e.g. "7–10 PM" |
| Price range | enum | `restaurants` | `price_tier` | ₹ \| ₹₹ \| ₹₹₹ \| ₹₹₹₹ |
| AI brief | text | `restaurants` | `ai_brief` | optional description |
| slug | text (auto) | `restaurants` | `slug` | generated from name + timestamp |
| owner_id | uuid (auto) | `restaurants` | `owner_id` | from auth session |
| listing_status | enum (auto) | `restaurants` | `listing_status` | `'draft'` |

---

## 9. Edit Listing Form
**Route**: `/dashboard/listings/[id]/edit`
**Component**: `components/live/ListingFormPage.tsx` (mode="edit")
**Supabase operation**: `supabase.from('restaurants').update().eq('id', id)`

Same fields as Create Listing — same table, same columns. slug is NOT updated on edit.

---

## 10. Restaurant Enquiry Form
**Route**: `/restaurants/[id]` (Overview tab)
**Component**: `components/live/RestaurantDetailLive.tsx`
**Supabase operation**: `supabase.from('enquiries').insert()`

| Field | Type | Table | Column | Constraints |
|---|---|---|---|---|
| Your name | text | `enquiries` | `sender_name` | required |
| Email | email | `enquiries` | `sender_email` | required, valid email |
| Phone | text | `enquiries` | `sender_phone` | optional |
| Message | text | `enquiries` | `message` | required |
| restaurant_id | uuid (auto) | `enquiries` | `restaurant_id` | from page context |
| status | enum (auto) | `enquiries` | `status` | set to `'new'` |

**RLS**: Public INSERT allowed — no auth required

---

## 11. Write a Review Form
**Route**: `/restaurants/[id]` (Reviews tab)
**Component**: `components/live/RestaurantDetailLive.tsx`
**Supabase operation**: `supabase.from('reviews').insert()`

| Field | Type | Table | Column | Constraints |
|---|---|---|---|---|
| Star rating | integer (1–5) | `reviews` | `rating` | 1–5, required |
| Review text | text | `reviews` | `body` | required |
| reviewer_name | text (auto) | `reviews` | `reviewer_name` | from enquiry.name or 'Anonymous' |
| restaurant_id | uuid (auto) | `reviews` | `restaurant_id` | from page context |
| verified_visit | boolean (auto) | `reviews` | `verified_visit` | `false` for public submissions |

---

## 12. Connect with Influencer Form
**Route**: `/influencers/[id]`
**Component**: `components/live/InfluencerProfileLive.tsx`
**Supabase operation**: `supabase.from('connection_requests').insert()`

| Field | Type | Table | Column | Constraints |
|---|---|---|---|---|
| Restaurant name | text | `connection_requests` | `restaurant_name` | required |
| Your name | text | `connection_requests` | `requester_name` | required |
| Collab interest | text | `connection_requests` | `collab_interest` | optional |
| influencer_id | uuid (auto) | `connection_requests` | `influencer_id` | from page context |
| status | enum (auto) | `connection_requests` | `status` | `'pending'` |

**RLS**: Public INSERT allowed

---

## 13. Claim Listing Form
**Route**: `/restaurants/[id]/claim`
**Component**: `components/live/ClaimListingPage.tsx`
**Supabase operation**: `supabase.from('listing_claims').insert()`

| Field | Type | Table | Column | Constraints |
|---|---|---|---|---|
| Evidence notes | text | `listing_claims` | `evidence_notes` | required |
| restaurant_id | uuid (auto) | `listing_claims` | `restaurant_id` | from page context |
| claimant_id | uuid (auto) | `listing_claims` | `claimant_id` | from auth session |
| status | enum (auto) | `listing_claims` | `status` | `'pending'` |

**RLS**: Auth required — must be signed in

---

## 14. Image Upload (Listing Form + Onboarding)
**Routes**: `/dashboard/listings/new`, `/dashboard/listings/[id]/edit`, `/onboarding`
**Component**: `components/ImageUploader.tsx`
**Supabase operations**:
- `supabase.storage.from('listing-images').upload(path, file)`
- `supabase.from('listing_images').insert()`

| Field | Type | Table | Column | Constraints |
|---|---|---|---|---|
| Photo file | File | `listing_images` | `storage_path`, `url` | JPG/PNG/WebP, ≤10MB |
| Alt text | text | `listing_images` | `alt_text` | optional |
| is_primary | boolean | `listing_images` | `is_primary` | first upload = true |
| restaurant_id | uuid (auto) | `listing_images` | `restaurant_id` | from prop |
| uploaded_by | uuid (auto) | `listing_images` | `uploaded_by` | from auth session |

---

## 15. Admin: Approve / Reject / Suspend Listing
**Route**: `/admin`
**Component**: `components/live/AdminDashboard.tsx`
**Supabase operations**:
- `supabase.from('restaurants').update()`
- `supabase.from('audit_logs').insert()`

| Action | Table | Column → Value |
|---|---|---|
| Approve | `restaurants` | `listing_status = 'approved'`, `approved_at = now()` |
| Reject | `restaurants` | `listing_status = 'rejected'` |
| Suspend | `restaurants` | `listing_status = 'suspended'` |
| All actions | `audit_logs` | `action`, `target_table = 'restaurants'`, `target_id` |

---

## 16. Admin: Delete Review
**Route**: `/admin/reviews`
**Component**: `components/live/AdminDashboard.tsx`
**Supabase operations**:
- `supabase.from('reviews').delete().eq('id', id)`
- `supabase.from('audit_logs').insert()`

| Action | Table | Notes |
|---|---|---|
| Delete | `reviews` | Hard delete — permanent |
| Log | `audit_logs` | `action = 'review.deleted'` |

---

## 17. Save / Unsave Restaurant (Toggle)
**Route**: `/restaurants/[id]`
**Component**: `components/live/RestaurantDetailLive.tsx`
**Supabase operations**:
- Save: `supabase.from('saved_listings').insert()`
- Unsave: `supabase.from('saved_listings').delete()`

| Field | Type | Table | Column |
|---|---|---|---|
| user_id | uuid (auto) | `saved_listings` | `user_id` |
| restaurant_id | uuid (auto) | `saved_listings` | `restaurant_id` |

**RLS**: Auth required

---

## 18. Search Forms (No DB Write)
**Routes**: `/explore`, `/restaurants`, `/influencers`

These filter client-side from already-fetched data or pass `?q=` URL params.
No data is written to or read from a dedicated search table.

---

## Forms that do NOT touch the database
| Form | Reason |
|---|---|
| Homepage search | Server action redirects to `/explore?q=` — no storage |
| Explore search | Client-side filter of cached data |
| Notification "Mark as read" | Currently UI state only (no DB write) |
| Chip / zone filters | Filter only — no storage |
