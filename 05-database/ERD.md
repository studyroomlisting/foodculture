# ERD.md — FoodCulture AI Entity Relationship Diagram

## Full ERD (text notation)

```
auth.users (Supabase Auth)
    │ id (uuid)
    ├──► profiles (1:1)
    │       id → auth.users.id
    │       full_name, phone, role, onboarding_complete
    │
    ├──► user_roles (1:many)
    │       user_id → profiles.id
    │       role
    │
    └──► restaurants (1:many via owner_id)
             owner_id → profiles.id

zones
    │ id, name, slug, trend_score
    ├──► restaurants (1:many)
    │       zone_id → zones.id
    └──► locations (1:many)
             zone_id → zones.id

restaurants
    │ id, slug, name, emoji, area_label, price_tier
    │ listing_status, owner_id, zone_id, location_id
    │ intelligence_score, rating, total_reviews
    │
    ├──► restaurant_dishes (1:many)
    │       restaurant_id → restaurants.id
    │       dish_id       → dishes.id
    │
    ├──► restaurant_categories (1:many)
    │       restaurant_id → restaurants.id
    │       category_id   → categories.id
    │
    ├──► influencer_restaurant_posts (1:many)
    │       restaurant_id → restaurants.id
    │       influencer_id → influencers.id
    │
    ├──► deals (1:many)
    │       restaurant_id → restaurants.id
    │
    ├──► reviews (1:many)
    │       restaurant_id → restaurants.id
    │
    ├──► connection_requests (1:many)
    │       restaurant_id → restaurants.id
    │       influencer_id → influencers.id
    │
    ├──► enquiries (1:many)
    │       restaurant_id → restaurants.id
    │
    ├──► listing_images (1:many)
    │       restaurant_id → restaurants.id
    │
    ├──► listing_claims (1:many)
    │       restaurant_id → restaurants.id
    │       claimant_id   → profiles.id
    │
    └──► saved_listings (1:many)
             restaurant_id → restaurants.id
             user_id       → profiles.id

influencers
    │ id, slug, name, handle, platform
    │ followers_count, impact_score, trust_score
    │
    ├──► influencer_pricing_tiers (1:many)
    │       influencer_id → influencers.id
    │
    ├──► influencer_restaurant_posts (1:many)
    │       influencer_id → influencers.id
    │       restaurant_id → restaurants.id
    │
    └──► connection_requests (1:many)
             influencer_id → influencers.id

categories
    │ id, slug, name, emoji
    └──► restaurant_categories (1:many)
             category_id → categories.id

locations
    │ id, slug, name, zone_id
    └──► restaurants (1:many via location_id)

dishes
    │ id, name, emoji, trend_label
    └──► restaurant_dishes (many:many pivot)

profiles
    │ id → auth.users.id
    │ full_name, role, onboarding_complete
    │
    ├──► saved_listings (1:many)
    ├──► listing_claims (1:many via claimant_id)
    ├──► listing_images (1:many via uploaded_by)
    ├──► audit_logs (1:many via actor_id)
    ├──► onboarding_progress (1:1)
    └──► notifications (1:many)

reviews
    │ id, restaurant_id, reviewer_name, rating, body
    └──► review_reports (1:many)
             review_id   → reviews.id
             reporter_id → profiles.id

notifications
    │ id, user_id → profiles.id
    │ type, message, read
```

---

## Key relationships summary

| Relationship | Type | Description |
|---|---|---|
| auth.users → profiles | 1:1 | Auto-created on signup via trigger |
| profiles → restaurants | 1:many | Owner manages their listings |
| restaurants → zones | many:1 | Each restaurant in one zone |
| restaurants → locations | many:1 | Each restaurant in one sub-area |
| restaurants ↔ categories | many:many | Via restaurant_categories |
| restaurants ↔ dishes | many:many | Via restaurant_dishes |
| influencers → restaurants | many:many | Via influencer_restaurant_posts |
| profiles → saved_listings | 1:many | User bookmarks |
| restaurants → enquiries | 1:many | Contact forms per restaurant |
| restaurants → reviews | 1:many | Customer reviews |
| reviews → review_reports | 1:many | Moderation flags |
| restaurants → listing_claims | 1:many | Ownership claim requests |
| restaurants → listing_images | 1:many | Photo uploads |
| profiles → onboarding_progress | 1:1 | Setup tracking |
| profiles → audit_logs | 1:many | Admin action history |

---

## Listing status lifecycle

```
[draft] → [pending_review] → [approved] → [suspended]
                         └──► [rejected]              └──► [archived]
```

- **draft**: created but not submitted
- **pending_review**: submitted, awaiting admin approval
- **approved**: live and publicly visible
- **rejected**: admin rejected (with rejection_reason stored)
- **suspended**: temporarily taken offline by admin
- **archived**: permanently removed from public view

---

## RLS access matrix

| Table | Visitor | Owner | Admin |
|---|---|---|---|
| zones | READ | READ | ALL |
| restaurants (approved) | READ | READ | ALL |
| restaurants (own) | — | ALL | ALL |
| influencers | READ | READ | ALL |
| deals | READ | READ | ALL |
| reviews | READ | READ | ALL |
| enquiries | INSERT | READ own | ALL |
| saved_listings | — | OWN | ALL |
| listing_claims | — | INSERT/read own | ALL |
| listing_images | READ | OWN | ALL |
| profiles | — | OWN | READ all |
| onboarding_progress | — | OWN | ALL |
| audit_logs | — | — | READ |
| connection_requests | INSERT | READ | ALL |
