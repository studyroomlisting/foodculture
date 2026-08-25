# Seeds Reference

The executable seed file is `supabase/seed.sql`.

This folder contains documentation only.

## What gets seeded

| Table | Rows | Description |
|---|---|---|
| zones | 5 | Koramangala, Indiranagar, HSR Layout, JP Nagar, Whitefield |
| restaurants | 5 | Dum Biryani House, Chettinad Corner, The Burger Lab, Coastal Kitchen, Saffron & Spice |
| influencers | 5 | Rahul Kitchens, Spice & Fork, Bangalore Bites, Curry Chronicles, Street Food Diaries |
| dishes | 8 | Dum Biryani, Masala Dosa, Smash Burger, Chettinad Chicken, etc. |
| deals | 4 | One per restaurant with varied color themes and discount levels |
| reviews | 8 | Mix of 4★ and 5★ verified reviews across restaurants |
| influencer_pricing_tiers | 10 | 2 tiers per influencer (Story+Reel, Full Campaign) |
| influencer_restaurant_posts | 5 | One post per influencer linking to a restaurant |
| activity_feed | 6 | Recent platform events for homepage live feed |
| categories | 8 | Biryani, South Indian, Street Food, Burgers, Seafood, Cafes, Fine Dining, Desserts |
| locations | 7 | Sub-areas within the 5 zones |

## Seeding order

Must match the migration order due to FK constraints:
1. zones (no dependencies)
2. categories (no dependencies)
3. restaurants (depends on zones)
4. dishes (no dependencies)
5. influencers (no dependencies)
6. locations (depends on zones)
7. influencer_pricing_tiers (depends on influencers)
8. influencer_restaurant_posts (depends on influencers + restaurants)
9. restaurant_dishes (depends on restaurants + dishes)
10. deals (depends on restaurants)
11. reviews (depends on restaurants)
12. activity_feed (no FK dependencies)
13. restaurant_categories (depends on restaurants + categories)
